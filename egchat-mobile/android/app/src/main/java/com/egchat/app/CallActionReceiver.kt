package com.egchat.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Recibe los taps de "Contestar" y "Rechazar" desde la notificación
 * aunque la app esté en segundo plano o bloqueada.
 */
class CallActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val callId = intent.getStringExtra(CallModule.EXTRA_CALL_ID) ?: return

        // Cerrar la notificación
        NotificationManagerCompat.from(context).cancel(CallModule.NOTIF_ID_CALL)

        when (intent.action) {
            CallModule.ACTION_ANSWER -> {
                // Abrir la app en la pantalla de llamada
                val openIntent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    action = "ANSWER_CALL"
                    putExtra(CallModule.EXTRA_CALL_ID, callId)
                }
                context.startActivity(openIntent)
                emitToReact(context, "callAnswered", callId)
            }
            CallModule.ACTION_REJECT -> {
                emitToReact(context, "callRejected", callId)
            }
        }
    }

    private fun emitToReact(context: Context, event: String, callId: String) {
        try {
            val app = context.applicationContext as MainApplication
            val catalyst = app.reactHost.currentReactContext ?: return
            catalyst
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(event, callId)
        } catch (_: Exception) {}
    }
}
