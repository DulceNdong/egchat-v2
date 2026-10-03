package com.egchat.app.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.egchat.app.MainActivity
import com.egchat.app.R
import com.egchat.app.modules.EGChatCallModule
import com.egchat.app.modules.CallActionReceiver
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject

/**
 * EGChatFirebaseMessagingService
 *
 * Recibe mensajes FCM cuando el proceso JS puede no estar disponible.
 * Maneja llamadas entrantes SIN depender de React Native.
 *
 * ESCENARIOS QUE CUBRE:
 *   - App en foreground    → delega a EGChatCallModule (JS disponible)
 *   - App en background    → muestra notificación full-screen
 *   - App suspendida       → idem, puede despertar el proceso
 *   - App terminada        → procesa en este servicio nativo, guarda en
 *                            SharedPreferences para que MainActivity
 *                            lo consuma al abrir
 *
 * ESCENARIO NO GARANTIZADO:
 *   - App terminada FORZOSAMENTE por el usuario (swipe-out en algunos OEMs
 *     como Xiaomi, Huawei, OPPO con modo ahorro agresivo) puede impedir
 *     la entrega de FCM. Esto es una restricción del sistema operativo,
 *     no un bug de la app.
 */
class EGChatFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val CHANNEL_ID       = "egchat_calls_native"
        private const val CHANNEL_NAME     = "Llamadas EGChat"
        private const val NOTIF_ID         = 9001
        const val PREFS_NAME               = "egchat_call_prefs"
        const val KEY_PENDING_CALL         = "pending_call_payload"
        const val KEY_PENDING_CALL_TS      = "pending_call_ts"
        private const val PENDING_CALL_TTL = 90_000L   // 90s — si es más vieja, ignorar
    }

    // ── onNewToken ────────────────────────────────────────────────────
    // FCM llama aquí cuando el token cambia. Guardar para sincronizar
    // con el servidor cuando JS esté disponible.
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString("fcm_token_pending_sync", token)
            .apply()
    }

    // ── onMessageReceived ─────────────────────────────────────────────
    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val data = message.data

        when (data["notificationType"]) {
            "incoming_call" -> handleIncomingCall(data)
            else            -> { /* otros tipos los gestiona expo-notifications */ }
        }
    }

    // ── handleIncomingCall ────────────────────────────────────────────
    private fun handleIncomingCall(data: Map<String, String>) {
        val callId     = data["callId"]     ?: return
        val callerName = data["callerName"] ?: "EGChat"
        val callType   = data["callType"]   ?: "audio"
        val isVideo    = callType == "video"

        // Guard anti-duplicado: ignorar si ya procesamos este callId
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lastCallId = prefs.getString("last_shown_call_id", null)
        if (callId == lastCallId) return
        prefs.edit().putString("last_shown_call_id", callId).apply()

        // Guardar en SharedPreferences para que MainActivity lo consuma
        // cuando la app abra (app terminada o recién iniciada)
        val payload = JSONObject().apply {
            put("callId",       callId)
            put("callerName",   callerName)
            put("callerAvatar", data["callerAvatar"] ?: "")
            put("callType",     callType)
            put("offer",        data["offer"] ?: "")
        }
        prefs.edit()
            .putString(KEY_PENDING_CALL,    payload.toString())
            .putLong(KEY_PENDING_CALL_TS,   System.currentTimeMillis())
            .apply()

        // Si React Native ya está corriendo, delegar al módulo nativo
        // (que emite el evento JS y muestra la notificación)
        val rnModule = EGChatCallModule.instance
        if (rnModule != null) {
            rnModule.showIncomingCall(callerName, "", callId, isVideo)
            return
        }

        // React Native NO está disponible → mostrar notificación full-screen
        // directamente desde aquí sin depender de JS.
        showIncomingCallNotification(callId, callerName, isVideo)
    }

    // ── showIncomingCallNotification ──────────────────────────────────
    // Notificación full-screen con botones Aceptar / Rechazar.
    // No requiere React Native.
    private fun showIncomingCallNotification(
        callId: String,
        callerName: String,
        isVideo: Boolean
    ) {
        createNotificationChannel()

        // Intent: abrir MainActivity con los datos de la llamada
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("callId",      callId)
            putExtra("callerName",  callerName)
            putExtra("isVideo",     isVideo)
            putExtra("action",      "incoming_call")
        }
        val openPending = PendingIntent.getActivity(
            this, NOTIF_ID, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intent: aceptar desde notificación
        val answerIntent = Intent(this, CallActionReceiver::class.java).apply {
            action = EGChatCallModule.ACTION_ANSWER
            putExtra("callId", callId)
        }
        val answerPending = PendingIntent.getBroadcast(
            this, NOTIF_ID + 1, answerIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intent: rechazar desde notificación
        val rejectIntent = Intent(this, CallActionReceiver::class.java).apply {
            action = EGChatCallModule.ACTION_REJECT
            putExtra("callId", callId)
        }
        val rejectPending = PendingIntent.getBroadcast(
            this, NOTIF_ID + 2, rejectIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val callTypeLabel = if (isVideo) "Videollamada" else "Llamada de voz"

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle("$callTypeLabel entrante")
            .setContentText(callerName)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setFullScreenIntent(openPending, true)
            .setContentIntent(openPending)
            .addAction(android.R.drawable.ic_menu_call,  "Aceptar",  answerPending)
            .addAction(android.R.drawable.ic_delete,     "Rechazar", rejectPending)
            .setColor(0xFF00C8A0.toInt())
            .setTimeoutAfter(90_000L)   // auto-dismiss tras 90s (TTL de la llamada)
            .build()

        // Despertar pantalla en Android 8.1+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            // No podemos llamar setTurnScreenOn desde un Service sin Activity.
            // En su lugar usamos la notificación full-screen que ya hace eso.
        }

        try {
            NotificationManagerCompat.from(this).notify(NOTIF_ID, notification)
        } catch (e: SecurityException) {
            // POST_NOTIFICATIONS denegado en Android 13+ → no hay nada más que hacer
        }
    }

    // ── createNotificationChannel ─────────────────────────────────────
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return

        val channel = NotificationChannel(
            CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description            = "Llamadas entrantes de EGChat"
            enableLights(true)
            lightColor             = Color.GREEN
            enableVibration(true)
            vibrationPattern       = longArrayOf(0, 500, 200, 500, 200, 500)
            setBypassDnd(true)
            lockscreenVisibility   = NotificationCompat.VISIBILITY_PUBLIC
        }
        manager.createNotificationChannel(channel)
    }
}
