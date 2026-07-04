package com.egchat.app

import android.content.Context
import com.facebook.react.bridge.*

/**
 * EGChat — Módulo para actualizar el widget desde React Native
 * Llamar después de cargar los chats para mantener el widget sincronizado.
 */
class WidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "EGChatWidgetModule"

    /**
     * Actualiza los datos del widget.
     * @param chatsJson JSON string: [{id, name, lastMsg, unread, avatar}]
     * @param unreadTotal número total de mensajes no leídos
     */
    @ReactMethod
    fun updateWidget(chatsJson: String, unreadTotal: Int) {
        val ctx = reactContext.applicationContext
        val prefs = ctx.getSharedPreferences(ChatWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(ChatWidgetProvider.KEY_CHATS, chatsJson)
            .putInt(ChatWidgetProvider.KEY_UNREAD, unreadTotal)
            .apply()

        // Forzar actualización de todos los widgets activos
        ChatWidgetProvider.updateAll(ctx)
    }

    @ReactMethod
    fun clearWidget() {
        val ctx = reactContext.applicationContext
        val prefs = ctx.getSharedPreferences(ChatWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
        ChatWidgetProvider.updateAll(ctx)
    }
}
