package com.egchat.app.modules

import android.app.KeyguardManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.egchat.app.MainActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * EGChat — Módulo nativo de llamadas Android
 * Equivalente al EGChatCallModule.swift de iOS.
 *
 * Muestra una notificación de llamada entrante de alta prioridad con botones
 * "Aceptar" y "Rechazar". En Android 10+, puede aparecer en pantalla completa.
 *
 * Eventos que emite a React Native (misma API que iOS CallKit):
 *   callAnswered(callId)  — usuario aceptó la llamada
 *   callRejected(callId)  — usuario rechazó la llamada
 *   callEnded(callId)     — llamada terminada
 */
class EGChatCallModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "EGChatCallModule"
        private const val CHANNEL_ID = "egchat_calls"
        private const val CHANNEL_NAME = "Llamadas EGChat"
        // Expuesto como const para que CallActionReceiver pueda cancelar la notificación
        const val NOTIF_ID_INCOMING = 1001

        // Acciones del BroadcastReceiver
        const val ACTION_ANSWER = "com.egchat.app.CALL_ANSWER"
        const val ACTION_REJECT = "com.egchat.app.CALL_REJECT"
        const val ACTION_END    = "com.egchat.app.CALL_END"

        // Singleton para emitir eventos desde el BroadcastReceiver y FirebaseMessagingService
        @Volatile
        var instance: EGChatCallModule? = null
    }

    private var currentCallId: String? = null

    init {
        instance = this
        createNotificationChannel()
    }

    override fun getName(): String = NAME

    // ── Crear canal de notificación (Android 8+) ─────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificaciones de llamadas entrantes"
                enableLights(true)
                lightColor = Color.GREEN
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)
                setBypassDnd(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }
            val manager = reactContext.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    // ── API expuesta a React Native ──────────────────────────────────────

    @ReactMethod
    fun showIncomingCall(callerName: String, callerAvatar: String, callId: String, isVideo: Boolean) {
        currentCallId = callId

        // Intent para abrir la app al tocar la notificación
        val openIntent = Intent(reactContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("callId", callId)
            putExtra("callerName", callerName)
            putExtra("isVideo", isVideo)
            putExtra("action", "incoming_call")
        }

        val openPending = PendingIntent.getActivity(
            reactContext, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intent para aceptar desde la notificación
        val answerIntent = Intent(reactContext, CallActionReceiver::class.java).apply {
            action = ACTION_ANSWER
            putExtra("callId", callId)
        }
        val answerPending = PendingIntent.getBroadcast(
            reactContext, 1, answerIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intent para rechazar desde la notificación
        val rejectIntent = Intent(reactContext, CallActionReceiver::class.java).apply {
            action = ACTION_REJECT
            putExtra("callId", callId)
        }
        val rejectPending = PendingIntent.getBroadcast(
            reactContext, 2, rejectIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val callType = if (isVideo) "Videollamada" else "Llamada de voz"

        val notification = NotificationCompat.Builder(reactContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle("$callType entrante")
            .setContentText(callerName)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setFullScreenIntent(openPending, true)  // Pantalla completa en Android 10+
            .setContentIntent(openPending)
            .addAction(android.R.drawable.ic_menu_call, "Aceptar", answerPending)
            .addAction(android.R.drawable.ic_delete, "Rechazar", rejectPending)
            .setColor(0xFF00C8A0.toInt())
            .build()

        // Despertar pantalla si está bloqueada
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            val activity = reactContext.currentActivity
            activity?.setShowWhenLocked(true)
            activity?.setTurnScreenOn(true)
        }

        NotificationManagerCompat.from(reactContext).notify(NOTIF_ID_INCOMING, notification)
    }

    @ReactMethod
    fun dismissIncomingCall() {
        NotificationManagerCompat.from(reactContext).cancel(NOTIF_ID_INCOMING)
        currentCallId = null
    }

    @ReactMethod
    fun answerCall(callId: String) {
        dismissIncomingCall()
        emitEvent("callAnswered", callId)
    }

    @ReactMethod
    fun rejectCall(callId: String) {
        dismissIncomingCall()
        emitEvent("callRejected", callId)
    }

    @ReactMethod
    fun endCall(callId: String) {
        dismissIncomingCall()
        emitEvent("callEnded", callId)
    }

    // ── RN event listener bookkeeping ─────────────────────────────────────

    @ReactMethod
    fun addListener(eventName: String) { /* noop */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* noop */ }

    // ── Leer y limpiar la llamada pendiente guardada por FirebaseMessagingService ──
    // Llamado desde JS (notifications.ts) cuando la app abre tras un FCM.
    // Devuelve null si no hay llamada pendiente o si caducó (>90s).
    @ReactMethod
    fun getAndClearPendingCall(promise: com.facebook.react.bridge.Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(
                com.egchat.app.services.EGChatFirebaseMessagingService.PREFS_NAME,
                android.content.Context.MODE_PRIVATE
            )
            val json = prefs.getString(
                com.egchat.app.services.EGChatFirebaseMessagingService.KEY_PENDING_CALL, null
            )
            val ts = prefs.getLong(
                com.egchat.app.services.EGChatFirebaseMessagingService.KEY_PENDING_CALL_TS, 0L
            )

            // Limpiar independientemente del resultado
            prefs.edit()
                .remove(com.egchat.app.services.EGChatFirebaseMessagingService.KEY_PENDING_CALL)
                .remove(com.egchat.app.services.EGChatFirebaseMessagingService.KEY_PENDING_CALL_TS)
                .apply()

            if (json == null || System.currentTimeMillis() - ts > 90_000L) {
                promise.resolve(null)
                return
            }

            promise.resolve(json)
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }

    // ── Leer y limpiar la acción pendiente (fix C1) ────────────────────
    // Cuando el usuario toca "Aceptar"/"Rechazar" con la app terminada,
    // CallActionReceiver guarda la acción en SharedPreferences porque JS
    // no estaba disponible. Al montar _layout.tsx, llama a este método
    // para obtener la acción pendiente y navegar a la pantalla correcta.
    @ReactMethod
    fun getAndClearPendingCallAction(promise: com.facebook.react.bridge.Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(
                com.egchat.app.services.EGChatFirebaseMessagingService.PREFS_NAME,
                android.content.Context.MODE_PRIVATE
            )
            val action  = prefs.getString(com.egchat.app.modules.CallActionReceiver.KEY_PENDING_CALL_ACTION, null)
            val callId  = prefs.getString(com.egchat.app.modules.CallActionReceiver.KEY_PENDING_CALL_ACTION_ID, null)
            val ts      = prefs.getLong(com.egchat.app.modules.CallActionReceiver.KEY_PENDING_CALL_ACTION_TS, 0L)

            // Limpiar siempre
            prefs.edit()
                .remove(com.egchat.app.modules.CallActionReceiver.KEY_PENDING_CALL_ACTION)
                .remove(com.egchat.app.modules.CallActionReceiver.KEY_PENDING_CALL_ACTION_ID)
                .remove(com.egchat.app.modules.CallActionReceiver.KEY_PENDING_CALL_ACTION_TS)
                .apply()

            // TTL 30s
            if (action == null || callId == null ||
                System.currentTimeMillis() - ts > 30_000L
            ) {
                promise.resolve(null)
                return
            }

            // Devolver como JSON: { action: "answer"|"reject"|"end", callId: string }
            val result = org.json.JSONObject().apply {
                put("action", action)
                put("callId", callId)
            }
            promise.resolve(result.toString())
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }

    // ── Iniciar/parar ForegroundService de llamada activa ──────────────
    @ReactMethod
    fun startCallForegroundService(callId: String, callerName: String, isVideo: Boolean) {
        com.egchat.app.services.CallForegroundService.start(
            reactContext, callId, callerName, isVideo
        )
    }

    @ReactMethod
    fun stopCallForegroundService() {
        com.egchat.app.services.CallForegroundService.stop(reactContext)
    }

    // ── Emitir eventos a JavaScript ───────────────────────────────────────

    fun emitEvent(eventName: String, callId: String) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, callId)
        } catch (e: Exception) {
            // App en background — ignorar
        }
    }
}
