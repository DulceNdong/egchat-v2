package com.egchat.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * EGChat — Módulo nativo de llamadas (Android)
 * Expone a React Native:
 *   - showIncomingCall(callerName, callerAvatar, callId, isVideo)
 *   - endCall(callId)
 *   - answerCall(callId)
 *   - rejectCall(callId)
 */
class CallModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val CHANNEL_CALLS = "egchat-calls"
        const val NOTIF_ID_CALL = 9001
        const val ACTION_ANSWER = "com.egchat.app.ANSWER_CALL"
        const val ACTION_REJECT = "com.egchat.app.REJECT_CALL"
        const val EXTRA_CALL_ID = "callId"
        const val EXTRA_CALLER = "callerName"
        const val EXTRA_IS_VIDEO = "isVideo"
    }

    override fun getName() = "EGChatCallModule"

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Canal de llamadas — alta prioridad, sonido de llamada
            val ringtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            val audioAttr = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            val channel = NotificationChannel(
                CHANNEL_CALLS,
                "Llamadas EGChat",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificaciones de llamadas entrantes"
                setSound(ringtone, audioAttr)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 500, 500, 500, 500)
                enableLights(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }
            nm.createNotificationChannel(channel)
        }
    }

    @ReactMethod
    fun showIncomingCall(callerName: String, callerAvatar: String, callId: String, isVideo: Boolean) {
        val ctx = reactContext.applicationContext

        // Intent para abrir la app al tocar la notificación
        val openIntent = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_CALL_ID, callId)
            putExtra(EXTRA_CALLER, callerName)
            putExtra(EXTRA_IS_VIDEO, isVideo)
            action = "INCOMING_CALL"
        }
        val openPi = PendingIntent.getActivity(
            ctx, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intent para CONTESTAR
        val answerIntent = Intent(ctx, CallActionReceiver::class.java).apply {
            action = ACTION_ANSWER
            putExtra(EXTRA_CALL_ID, callId)
        }
        val answerPi = PendingIntent.getBroadcast(
            ctx, 1, answerIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intent para RECHAZAR
        val rejectIntent = Intent(ctx, CallActionReceiver::class.java).apply {
            action = ACTION_REJECT
            putExtra(EXTRA_CALL_ID, callId)
        }
        val rejectPi = PendingIntent.getBroadcast(
            ctx, 2, rejectIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val callType = if (isVideo) "Videollamada entrante" else "Llamada entrante"
        val ringtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

        val notif = NotificationCompat.Builder(ctx, CHANNEL_CALLS)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle(callerName)
            .setContentText(callType)
            .setSubText("EGChat")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setFullScreenIntent(openPi, true)   // ← abre pantalla completa en bloqueo
            .setContentIntent(openPi)
            .setOngoing(true)
            .setAutoCancel(false)
            .setSound(ringtone)
            .setVibrate(longArrayOf(0, 500, 500, 500, 500, 500))
            .addAction(
                android.R.drawable.ic_menu_call,
                "✅ Contestar",
                answerPi
            )
            .addAction(
                android.R.drawable.ic_delete,
                "❌ Rechazar",
                rejectPi
            )
            .build()

        val nm = NotificationManagerCompat.from(ctx)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ActivityCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED
        ) {
            nm.notify(NOTIF_ID_CALL, notif)
        }
    }

    @ReactMethod
    fun dismissIncomingCall() {
        NotificationManagerCompat.from(reactContext).cancel(NOTIF_ID_CALL)
    }

    @ReactMethod
    fun endCall(callId: String) {
        dismissIncomingCall()
        emitEvent("callEnded", callId)
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

    private fun emitEvent(event: String, callId: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, callId)
    }

    // Requerido por React Native para suscripción a eventos
    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
