package com.egchat.app

import android.app.NotificationManager
import android.app.PendingIntent
import android.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.RemoteInput as CoreRemoteInput
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * EGChat — Respuesta rápida desde notificación (Android 7+)
 * El usuario puede responder directamente desde la notificación
 * sin abrir la app, igual que WhatsApp.
 */
class QuickReplyModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "EGChatQuickReply"

    companion object {
        const val REPLY_KEY = "egchat_quick_reply_text"
        const val ACTION_REPLY = "com.egchat.app.QUICK_REPLY"
        const val EXTRA_CHAT_ID = "chatId"
        const val EXTRA_NOTIF_ID = "notifId"

        /** Extraer el texto de respuesta de un Intent de respuesta rápida */
        fun getReplyText(intent: Intent): String? {
            val remoteInput = CoreRemoteInput.getResultsFromIntent(intent)
            return remoteInput?.getCharSequence(REPLY_KEY)?.toString()
        }
    }

    /**
     * Añadir acción de respuesta rápida a una notificación existente.
     * Llamar después de showMessageNotification.
     */
    @ReactMethod
    fun addQuickReplyAction(chatId: String, notifId: Int) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return

        val ctx = reactContext.applicationContext

        val remoteInput = CoreRemoteInput.Builder(REPLY_KEY)
            .setLabel("Responder...")
            .build()

        val replyIntent = Intent(ctx, QuickReplyReceiver::class.java).apply {
            action = ACTION_REPLY
            putExtra(EXTRA_CHAT_ID, chatId)
            putExtra(EXTRA_NOTIF_ID, notifId)
        }
        val replyPi = PendingIntent.getBroadcast(
            ctx, notifId + 100, replyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )

        val replyAction = NotificationCompat.Action.Builder(
            android.R.drawable.ic_menu_send,
            "Responder",
            replyPi,
        )
            .addRemoteInput(remoteInput)
            .setAllowGeneratedReplies(true)
            .build()

        // Actualizar la notificación existente con la acción de respuesta
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val existing = nm.activeNotifications.find { it.id == notifId }
        if (existing != null) {
            val builder = NotificationCompat.Builder(ctx, RichNotificationModule.CHANNEL_MESSAGES)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(existing.notification.extras.getString("android.title") ?: "")
                .setContentText(existing.notification.extras.getString("android.text") ?: "")
                .addAction(replyAction)
                .setAutoCancel(true)

            NotificationManagerCompat.from(ctx).notify(notifId, builder.build())
        }
    }

    @ReactMethod fun addListener(e: String) {}
    @ReactMethod fun removeListeners(c: Int) {}
}
