package com.egchat.app.modules

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.egchat.app.services.EGChatFirebaseMessagingService

/**
 * BroadcastReceiver que procesa los botones "Aceptar" y "Rechazar"
 * de la notificación de llamada entrante.
 *
 * FIX C1: cuando EGChatCallModule.instance == null (proceso JS aún no
 * disponible porque la app estaba terminada), los eventos se guardaban en
 * SharedPreferences como "pending_call_action" para que _layout.tsx los
 * consuma vía consumePendingCallAction() al montar.
 *
 * FLUJO con app terminada:
 *   1. FCM llega → EGChatFirebaseMessagingService muestra notificación.
 *   2. Usuario toca "Aceptar" → CallActionReceiver.onReceive().
 *   3. EGChatCallModule.instance == null → guardamos acción en SharedPrefs.
 *   4. MainActivity abre → JS monta → _layout.tsx llama consumePendingCallAction().
 *   5. JS recibe {action:"answer", callId} y navega a /call/[callId].
 *
 * FLUJO con app en background:
 *   1. FCM llega → EGChatFirebaseMessagingService detecta módulo RN disponible.
 *   2. Usuario toca "Aceptar" → CallActionReceiver.onReceive().
 *   3. EGChatCallModule.instance != null → emitEvent("callAnswered") directo.
 */
class CallActionReceiver : BroadcastReceiver() {

    companion object {
        const val KEY_PENDING_CALL_ACTION    = "pending_call_action"
        const val KEY_PENDING_CALL_ACTION_ID = "pending_call_action_id"
        const val KEY_PENDING_CALL_ACTION_TS = "pending_call_action_ts"

        // Si la acción tiene más de 30s, descartarla (la llamada ya caducó)
        private const val ACTION_TTL_MS = 30_000L
    }

    override fun onReceive(context: Context, intent: Intent) {
        val callId = intent.getStringExtra("callId") ?: return

        // Descartar la notificación sea cual sea el path
        dismissNotification(context)

        val module = EGChatCallModule.instance

        when (intent.action) {
            EGChatCallModule.ACTION_ANSWER -> {
                if (module != null) {
                    module.dismissIncomingCall()
                    module.emitEvent("callAnswered", callId)
                    // Abrir la app en la pantalla de llamada si estaba en background
                    launchCallScreen(context, callId, intent)
                } else {
                    // JS no disponible → guardar para que _layout.tsx lo consuma
                    savePendingAction(context, "answer", callId)
                    launchCallScreen(context, callId, intent)
                }
            }
            EGChatCallModule.ACTION_REJECT -> {
                if (module != null) {
                    module.dismissIncomingCall()
                    module.emitEvent("callRejected", callId)
                } else {
                    savePendingAction(context, "reject", callId)
                    // Para reject no necesitamos abrir la app
                }
            }
            EGChatCallModule.ACTION_END -> {
                if (module != null) {
                    module.dismissIncomingCall()
                    module.emitEvent("callEnded", callId)
                } else {
                    savePendingAction(context, "end", callId)
                }
            }
        }
    }

    // ── Guardar acción pendiente cuando JS no está disponible ─────────
    private fun savePendingAction(context: Context, action: String, callId: String) {
        context.getSharedPreferences(
            EGChatFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE
        ).edit()
            .putString(KEY_PENDING_CALL_ACTION,    action)
            .putString(KEY_PENDING_CALL_ACTION_ID, callId)
            .putLong(KEY_PENDING_CALL_ACTION_TS,   System.currentTimeMillis())
            .apply()
    }

    // ── Cancelar la notificación full-screen ──────────────────────────
    private fun dismissNotification(context: Context) {
        try {
            val nm = context.getSystemService(NotificationManager::class.java)
            nm?.cancel(EGChatFirebaseMessagingService.NOTIF_ID_INCOMING)
            nm?.cancel(EGChatCallModule.NOTIF_ID_INCOMING)
        } catch (_: Exception) {}
    }

    // ── Lanzar pantalla de llamada ────────────────────────────────────
    // Necesario cuando la app estaba en background o terminada y el usuario
    // toca "Aceptar" en la notificación.
    private fun launchCallScreen(context: Context, callId: String, original: Intent) {
        val launch = Intent(context, com.egchat.app.MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("action",     "incoming_call")
            putExtra("callId",     callId)
            putExtra("callerName", original.getStringExtra("callerName") ?: "")
            putExtra("isVideo",    original.getBooleanExtra("isVideo", false))
        }
        context.startActivity(launch)
    }
}
