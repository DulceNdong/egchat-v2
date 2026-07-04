package com.egchat.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Recibe la respuesta rápida del usuario y la emite a React Native.
 */
class QuickReplyReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != QuickReplyModule.ACTION_REPLY) return

        val chatId  = intent.getStringExtra(QuickReplyModule.EXTRA_CHAT_ID) ?: return
        val notifId = intent.getIntExtra(QuickReplyModule.EXTRA_NOTIF_ID, -1)
        val text    = QuickReplyModule.getReplyText(intent) ?: return

        // Cerrar la notificación
        if (notifId != -1) NotificationManagerCompat.from(context).cancel(notifId)

        // Emitir a React Native
        try {
            val app = context.applicationContext as MainApplication
            val ctx = app.reactHost.currentReactContext ?: return
            val payload = com.facebook.react.bridge.Arguments.createMap().apply {
                putString("chatId", chatId)
                putString("text", text)
            }
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
               ?.emit("quickReply", payload)
        } catch (_: Exception) {}
    }
}
