package com.egchat.app.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.egchat.app.MainActivity
import com.egchat.app.modules.EGChatCallModule

/**
 * CallForegroundService
 *
 * Foreground Service para llamadas activas en Android.
 *
 * PROPÓSITO:
 *   - Mantiene el proceso JS vivo mientras la app está en background.
 *   - Gestiona AudioFocus correctamente incluyendo interrupciones.
 *   - Emite eventos al CallManager via EGChatCallModule cuando
 *     llega una llamada telefónica (AUDIOFOCUS_LOSS_TRANSIENT).
 *
 * CAMBIOS vs versión anterior:
 *   - AudioFocusChangeListener implementado (no vacío).
 *   - Pausa/reanuda tracks de audio ante interrupciones telefónicas.
 *   - Limpieza correcta en onDestroy.
 *
 * LIMITACIONES:
 *   - START_STICKY reinicia el servicio si el SO lo mata, pero con
 *     intent=null. En ese caso no se pueden recuperar callId/callerName.
 *   - OEM killers agresivos (Xiaomi, Huawei, OPPO) pueden ignorar
 *     START_STICKY. Es una restricción del SO.
 */
class CallForegroundService : Service() {

    companion object {
        private const val CHANNEL_ID  = "egchat_call_active"
        private const val CHANNEL_NAME = "Llamada activa"
        private const val NOTIF_ID    = 9002

        const val ACTION_START          = "com.egchat.app.CALL_FOREGROUND_START"
        const val ACTION_STOP           = "com.egchat.app.CALL_FOREGROUND_STOP"
        const val EXTRA_CALL_ID         = "callId"
        const val EXTRA_CALLER_NAME     = "callerName"
        const val EXTRA_IS_VIDEO        = "isVideo"

        fun start(context: Context, callId: String, callerName: String, isVideo: Boolean) {
            val intent = Intent(context, CallForegroundService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_CALL_ID,    callId)
                putExtra(EXTRA_CALLER_NAME, callerName)
                putExtra(EXTRA_IS_VIDEO,    isVideo)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, CallForegroundService::class.java))
        }
    }

    private var audioFocusRequest: AudioFocusRequest? = null
    private var audioManager:      AudioManager?      = null
    private var currentCallId:     String             = ""

    // ── AudioFocusChangeListener ───────────────────────────────────
    // Gestiona interrupciones telefónicas y otras apps de audio.
    private val audioFocusListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
        val module = EGChatCallModule.instance

        when (focusChange) {
            AudioManager.AUDIOFOCUS_LOSS -> {
                // Pérdida permanente (otra app tomó el audio, ej. Spotify)
                // Pausar pero no terminar la llamada — el usuario decide
                module?.emitEvent("audioInterrupted", currentCallId)
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                // Pérdida temporal (llamada telefónica entrante)
                // Pausar el micrófono temporalmente — la llamada sigue conectada
                module?.emitEvent("audioInterrupted", currentCallId)
            }
            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                // Otra app quiere audio pero podemos reducir volumen
                // No hacemos nada — WebRTC gestiona su propio volumen
            }
            AudioManager.AUDIOFOCUS_GAIN -> {
                // Recuperamos el foco (llamada telefónica terminó, etc.)
                // Reanudar micrófono
                module?.emitEvent("audioRouteChanged", currentCallId)
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        audioManager = getSystemService(AUDIO_SERVICE) as? AudioManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                currentCallId = intent.getStringExtra(EXTRA_CALL_ID) ?: ""
                val callerName = intent.getStringExtra(EXTRA_CALLER_NAME) ?: "Llamada"
                val isVideo    = intent.getBooleanExtra(EXTRA_IS_VIDEO, false)

                val notification = buildCallNotification(callerName, currentCallId, isVideo)
                startForeground(NOTIF_ID, notification)
                requestAudioFocus()
            }
            ACTION_STOP, null -> {
                abandonAudioFocus()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        // START_STICKY: el sistema reiniciará el servicio si lo mata.
        // Con intent=null no podemos recuperar callId — el JS debe manejar
        // este caso con consumePendingCall() o el estado de Supabase.
        return START_STICKY
    }

    override fun onDestroy() {
        abandonAudioFocus()
        super.onDestroy()
    }

    // ── Notificación persistente de llamada activa ─────────────────
    private fun buildCallNotification(
        callerName: String,
        callId:     String,
        isVideo:    Boolean
    ): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags  = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            action = "OPEN_ACTIVE_CALL"
            putExtra(EXTRA_CALL_ID, callId)
        }
        val openPending = PendingIntent.getActivity(
            this, NOTIF_ID, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val endIntent = Intent(this, com.egchat.app.modules.CallActionReceiver::class.java).apply {
            action = EGChatCallModule.ACTION_END
            putExtra("callId", callId)
        }
        val endPending = PendingIntent.getBroadcast(
            this, NOTIF_ID + 3, endIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val typeLabel = if (isVideo) "Videollamada" else "Llamada de voz"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle("$typeLabel en curso")
            .setContentText(callerName)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setOngoing(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(openPending)
            .addAction(android.R.drawable.ic_delete, "Colgar", endPending)
            .setColor(0xFF00C8A0.toInt())
            .build()
    }

    // ── AudioFocus ─────────────────────────────────────────────────
    private fun requestAudioFocus() {
        val am = audioManager ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val attrs = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()

            val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attrs)
                .setAcceptsDelayedFocusGain(false)
                .setOnAudioFocusChangeListener(audioFocusListener)  // ← listener real
                .build()

            audioFocusRequest = request
            am.requestAudioFocus(request)
        } else {
            @Suppress("DEPRECATION")
            am.requestAudioFocus(
                audioFocusListener,
                AudioManager.STREAM_VOICE_CALL,
                AudioManager.AUDIOFOCUS_GAIN
            )
        }
    }

    private fun abandonAudioFocus() {
        val am = audioManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { am.abandonAudioFocusRequest(it) }
        } else {
            @Suppress("DEPRECATION")
            am.abandonAudioFocus(audioFocusListener)
        }
        audioFocusRequest = null
    }

    // ── Canal de notificación ──────────────────────────────────────
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return

        val channel = NotificationChannel(
            CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW
        ).apply {
            description          = "Mantiene activa la llamada en segundo plano"
            enableLights(false)
            enableVibration(false)
            setShowBadge(false)
            lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
        }
        manager.createNotificationChannel(channel)
    }
}
