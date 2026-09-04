package com.egchat.app.modules

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.egchat.app.MainActivity
import com.egchat.app.R
import org.json.JSONArray

/**
 * EGChat — AppWidgetProvider para el widget de pantalla de inicio.
 * Lee los datos guardados por EGChatWidgetModule y actualiza la RemoteView.
 */
class EGChatWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { id ->
            updateWidget(context, appWidgetManager, id)
        }
    }

    companion object {
        fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val prefs = context.getSharedPreferences(
                EGChatWidgetModule.PREFS_NAME, Context.MODE_PRIVATE
            )
            val chatsJson = prefs.getString(EGChatWidgetModule.KEY_CHATS, "[]") ?: "[]"
            val unreadTotal = prefs.getInt(EGChatWidgetModule.KEY_UNREAD, 0)

            val views = RemoteViews(context.packageName, R.layout.widget_egchat)

            // Intent para abrir la app al tocar el widget
            val openIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val openPending = PendingIntent.getActivity(
                context, 0, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, openPending)

            // Badge de no leídos
            if (unreadTotal > 0) {
                views.setTextViewText(R.id.widget_badge, unreadTotal.toString())
                views.setViewVisibility(R.id.widget_badge, android.view.View.VISIBLE)
            } else {
                views.setViewVisibility(R.id.widget_badge, android.view.View.GONE)
            }

            // Mostrar hasta 3 chats
            try {
                val chats = JSONArray(chatsJson)
                val chatViews = listOf(
                    Triple(R.id.chat_name_1, R.id.chat_msg_1, R.id.chat_unread_1),
                    Triple(R.id.chat_name_2, R.id.chat_msg_2, R.id.chat_unread_2),
                    Triple(R.id.chat_name_3, R.id.chat_msg_3, R.id.chat_unread_3),
                )

                chatViews.forEachIndexed { index, (nameId, msgId, unreadId) ->
                    if (index < chats.length()) {
                        val chat = chats.getJSONObject(index)
                        val name = chat.optString("name", "Chat")
                        val msg = chat.optString("lastMsg", "")
                        val unread = chat.optInt("unread", 0)

                        views.setTextViewText(nameId, name)
                        views.setTextViewText(msgId, msg)

                        if (unread > 0) {
                            views.setTextViewText(unreadId, unread.toString())
                            views.setViewVisibility(unreadId, android.view.View.VISIBLE)
                        } else {
                            views.setViewVisibility(unreadId, android.view.View.GONE)
                        }
                        views.setViewVisibility(nameId, android.view.View.VISIBLE)
                        views.setViewVisibility(msgId, android.view.View.VISIBLE)
                    } else {
                        // Ocultar fila si no hay chat
                        views.setViewVisibility(nameId, android.view.View.GONE)
                        views.setViewVisibility(msgId, android.view.View.GONE)
                        views.setViewVisibility(unreadId, android.view.View.GONE)
                    }
                }
            } catch (e: Exception) {
                // JSON inválido — mostrar widget vacío
            }

            manager.updateAppWidget(widgetId, views)
        }
    }
}
