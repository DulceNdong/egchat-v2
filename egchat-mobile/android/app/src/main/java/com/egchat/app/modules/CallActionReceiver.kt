package com.egchat.app.modules

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * BroadcastReceiver que procesa los botones "Aceptar" y "Rechazar"
 * de la notificación de llamada entrante.
 * Reenvía la acción a EGChatCallModule para emitirla a React Native.
 */
class CallActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val callId = intent.getStringExtra("callId") ?: return
        val module = EGChatCallModule.instance ?: return

        when (intent.action) {
            EGChatCallModule.ACTION_ANSWER -> {
                module.dismissIncomingCall()
                module.emitEvent("callAnswered", callId)
            }
            EGChatCallModule.ACTION_REJECT -> {
                module.dismissIncomingCall()
                module.emitEvent("callRejected", callId)
            }
            EGChatCallModule.ACTION_END -> {
                module.dismissIncomingCall()
                module.emitEvent("callEnded", callId)
            }
        }
    }
}
