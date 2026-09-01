package com.egchat.app.modules

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONArray

/**
 * EGChat — Widget de pantalla de inicio Android
 * Equivalente al EGChatWidgetModule.swift (WidgetKit) de iOS.
 *
 * Guarda los datos del widget en SharedPreferences y notifica al
 * AppWidgetProvider para que redibuje el widget.
 *
 * El widget en sí se define en EGChatWidgetProvider.kt +
 * res/layout/widget_egchat.xml (creados más abajo).
 *
 * Misma API TypeScript que HomeWidget.ts usa:
 *   updateWidget(chatsJson, unreadTotal)
 *   clearWidget()
 */
class EGChatWidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "EGChatWidgetModule"
        const val PREFS_NAME = "egchat_widget_prefs"
        const val KEY_CHATS = "widget_chats"
        const val KEY_UNREAD = "widget_unread_total"
    }

    override fun getName(): String = NAME

    /**
     * Actualiza el widget con los últimos chats.
     * @param chatsJson   JSON array con hasta 3 chats: [{id,name,lastMsg,unread,avatar}]
     * @param unreadTotal Total de mensajes no leídos (para el badge)
     */
    @ReactMethod
    fun updateWidget(chatsJson: String, unreadTotal: Int) {
        try {
            // Guardar datos en SharedPreferences (el widget los lee desde aquí)
            val prefs: SharedPreferences = reactContext.getSharedPreferences(
                PREFS_NAME, Context.MODE_PRIVATE
            )
            prefs.edit().apply {
                putString(KEY_CHATS, chatsJson)
                putInt(KEY_UNREAD, unreadTotal)
                apply()
            }

            // Notificar al AppWidgetManager para redibujar
            refreshAllWidgets()
        } catch (e: Exception) {
            // Silencioso — el widget no es crítico
        }
    }

    @ReactMethod
    fun clearWidget() {
        try {
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().clear().apply()
            refreshAllWidgets()
        } catch (e: Exception) {
            // Silencioso
        }
    }

    private fun refreshAllWidgets() {
        val manager = AppWidgetManager.getInstance(reactContext)
        val component = ComponentName(reactContext, EGChatWidgetProvider::class.java)
        val ids = manager.getAppWidgetIds(component)
        if (ids.isNotEmpty()) {
            val intent = android.content.Intent(
                reactContext,
                EGChatWidgetProvider::class.java
            ).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            reactContext.sendBroadcast(intent)
        }
    }
}
