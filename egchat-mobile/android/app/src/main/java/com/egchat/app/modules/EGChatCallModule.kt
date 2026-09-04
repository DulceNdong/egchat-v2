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
        private const val NOTIF_ID = 1001

        // Acciones del BroadcastReceiver
        const val ACTION_ANSWER = "com.egchat.app.CALL_ANSWER"
        const val ACTION_REJECT = "com.egchat.app.CALL_REJECT"
        const val ACTION_END    = "com.egchat.app.CALL_END"

        // Singleton para emitir eventos desde el BroadcastReceiver
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

        NotificationManagerCompat.from(reactContext).notify(NOTIF_ID, notification)
    }

    @ReactMethod
    fun dismissIncomingCall() {
        NotificationManagerCompat.from(reactContext).cancel(NOTIF_ID)
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
