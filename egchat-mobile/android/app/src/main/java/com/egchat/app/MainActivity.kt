package com.egchat.app

import android.content.Intent
import android.os.Build
import android.os.Bundle
import com.egchat.app.modules.EGChatShareModule
import com.egchat.app.services.EGChatFirebaseMessagingService
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import org.json.JSONObject

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.AppTheme)
        super.onCreate(null)
        handleShareIntent(intent)
        handleCallIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleShareIntent(intent)
        handleCallIntent(intent)
    }

    // ── Manejar intent de llamada ──────────────────────────────────────
    // Cuando el usuario toca la notificación full-screen (app terminada),
    // la app abre con estos extras. Los escribimos en SharedPreferences
    // para que _layout.tsx los consuma via consumePendingCall().
    private fun handleCallIntent(intent: Intent?) {
        if (intent == null) return

        val action   = intent.getStringExtra("action")
        val callId   = intent.getStringExtra("callId")
        val openCall = intent.action == "OPEN_ACTIVE_CALL"

        if ((action == "incoming_call" || openCall) && !callId.isNullOrEmpty()) {
            val callerName = intent.getStringExtra("callerName") ?: ""
            val isVideo    = intent.getBooleanExtra("isVideo", false)

            val prefs = getSharedPreferences(
                EGChatFirebaseMessagingService.PREFS_NAME, MODE_PRIVATE
            )
            val existingTs = prefs.getLong(
                EGChatFirebaseMessagingService.KEY_PENDING_CALL_TS, 0L
            )
            val isStale = System.currentTimeMillis() - existingTs > 5_000L

            // Solo actualizar si no hay ya un pending reciente
            if (prefs.getString(EGChatFirebaseMessagingService.KEY_PENDING_CALL, null) == null
                || isStale
            ) {
                val payload = JSONObject().apply {
                    put("callId",       callId)
                    put("callerName",   callerName)
                    put("callType",     if (isVideo) "video" else "audio")
                    put("callerAvatar", "")
                    put("offer",        "")
                }
                prefs.edit()
                    .putString(
                        EGChatFirebaseMessagingService.KEY_PENDING_CALL,
                        payload.toString()
                    )
                    .putLong(
                        EGChatFirebaseMessagingService.KEY_PENDING_CALL_TS,
                        System.currentTimeMillis()
                    )
                    .apply()
            }
        }
    }

    private fun handleShareIntent(intent: Intent?) {
        if (intent == null) return
        val action = intent.action
        if (action == Intent.ACTION_SEND || action == Intent.ACTION_SEND_MULTIPLE) {
            EGChatShareModule.instance?.handleIntent(intent)
        }
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                fabricEnabled
            ) {}
        )
    }

    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed()
            }
            return
        }
        super.invokeDefaultOnBackPressed()
    }
}
