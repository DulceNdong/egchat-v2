package com.egchat.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.widget.RemoteViews
import org.json.JSONArray
import java.net.URL

/**
 * EGChat — Widget de pantalla de inicio (Android)
 *
 * Muestra:
 *   - Últimos 3 chats con mensajes no leídos
 *   - Avatar circular del contacto
 *   - Nombre + último mensaje + hora
 *   - Badge con número de no leídos
 *   - Botón "Nuevo chat"
 *
 * Los datos se actualizan cuando la app guarda en SharedPreferences.
 */
class ChatWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "EGChatWidget"
        const val KEY_CHATS  = "widget_chats"   // JSON array
        const val KEY_UNREAD = "widget_unread_total"
        const val ACTION_OPEN_CHAT = "com.egchat.app.WIDGET_OPEN_CHAT"
        const val EXTRA_CHAT_ID    = "chatId"

        /** Llamar desde JS/WidgetModule para actualizar los datos */
        fun updateAll(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(
                android.content.ComponentName(context, ChatWidgetProvider::class.java)
            )
            if (ids.isNotEmpty()) {
                val provider = ChatWidgetProvider()
                provider.onUpdate(context, mgr, ids)
            }
        }
    }

    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
        for (id in ids) updateWidget(ctx, mgr, id)
    }

    private fun updateWidget(ctx: Context, mgr: AppWidgetManager, widgetId: Int) {
        val prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val chatsJson = prefs.getString(KEY_CHATS, "[]") ?: "[]"
        val unreadTotal = prefs.getInt(KEY_UNREAD, 0)

        val views = RemoteViews(ctx.packageName, R.layout.widget_chat)

        // Título con contador
        val title = if (unreadTotal > 0) "EGChat · $unreadTotal" else "EGChat"
        views.setTextViewText(R.id.widget_title, title)

        // Botón "Nuevo chat"
        val newChatIntent = Intent(ctx, MainActivity::class.java).apply {
            action = "NEW_CHAT"
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        val newChatPi = PendingIntent.getActivity(
            ctx, 0, newChatIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_new_chat_btn, newChatPi)

        // Cargar chats en hilo de fondo
        Thread {
            try {
                val chats = JSONArray(chatsJson)
                val rowIds = listOf(R.id.widget_row_1, R.id.widget_row_2, R.id.widget_row_3)
                val avatarIds = listOf(R.id.widget_avatar_1, R.id.widget_avatar_2, R.id.widget_avatar_3)
                val nameIds  = listOf(R.id.widget_name_1, R.id.widget_name_2, R.id.widget_name_3)
                val msgIds   = listOf(R.id.widget_msg_1, R.id.widget_msg_2, R.id.widget_msg_3)
                val badgeIds = listOf(R.id.widget_badge_1, R.id.widget_badge_2, R.id.widget_badge_3)

                for (i in 0..2) {
                    if (i < chats.length()) {
                        val chat = chats.getJSONObject(i)
                        val chatId   = chat.optString("id")
                        val name     = chat.optString("name", "Chat")
                        val lastMsg  = chat.optString("lastMsg", "")
                        val unread   = chat.optInt("unread", 0)
                        val avatarUrl = chat.optString("avatar", "")

                        views.setViewVisibility(rowIds[i], android.view.View.VISIBLE)
                        views.setTextViewText(nameIds[i], name)
                        views.setTextViewText(msgIds[i], lastMsg)

                        if (unread > 0) {
                            views.setViewVisibility(badgeIds[i], android.view.View.VISIBLE)
                            views.setTextViewText(badgeIds[i], if (unread > 99) "99+" else unread.toString())
                        } else {
                            views.setViewVisibility(badgeIds[i], android.view.View.GONE)
                        }

                        // Cargar avatar
                        val bmp = if (avatarUrl.isNotEmpty()) {
                            loadCircularBitmap(avatarUrl) ?: makeInitialsBitmap(name)
                        } else {
                            makeInitialsBitmap(name)
                        }
                        views.setImageViewBitmap(avatarIds[i], bmp)

                        // Intent para abrir el chat al tocar la fila
                        val openIntent = Intent(ctx, MainActivity::class.java).apply {
                            action = ACTION_OPEN_CHAT
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            putExtra(EXTRA_CHAT_ID, chatId)
                        }
                        val pi = PendingIntent.getActivity(
                            ctx, i + 10, openIntent,
                            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                        )
                        views.setOnClickPendingIntent(rowIds[i], pi)
                    } else {
                        views.setViewVisibility(rowIds[i], android.view.View.GONE)
                    }
                }
                mgr.updateAppWidget(widgetId, views)
            } catch (_: Exception) {
                mgr.updateAppWidget(widgetId, views)
            }
        }.start()
    }

    /** Descarga imagen y la recorta en círculo */
    private fun loadCircularBitmap(url: String): Bitmap? {
        return try {
            val conn = URL(url).openConnection().apply { connectTimeout = 3000; readTimeout = 3000 }
            val raw  = BitmapFactory.decodeStream(conn.getInputStream()) ?: return null
            val size = 96
            val scaled = Bitmap.createScaledBitmap(raw, size, size, true)
            val output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(output)
            val paint  = Paint(Paint.ANTI_ALIAS_FLAG)
            canvas.drawOval(RectF(0f, 0f, size.toFloat(), size.toFloat()), paint)
            paint.xfermode = android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.SRC_IN)
            canvas.drawBitmap(scaled, 0f, 0f, paint)
            output
        } catch (_: Exception) { null }
    }

    /** Genera un bitmap con las iniciales del nombre */
    private fun makeInitialsBitmap(name: String): Bitmap {
        val size    = 96
        val initials = name.split(" ").filter { it.isNotEmpty() }
            .take(2).joinToString("") { it[0].uppercaseChar().toString() }
        val colors = listOf(0xFF00c8a0, 0xFF00b4e6, 0xFF8b5cf6, 0xFFef4444, 0xFFf59e0b)
        val bg = colors[Math.abs(name.hashCode()) % colors.size].toInt()

        val bmp    = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val paint  = Paint(Paint.ANTI_ALIAS_FLAG)
        paint.color = (0xFF000000.toInt() or bg)
        canvas.drawOval(RectF(0f, 0f, size.toFloat(), size.toFloat()), paint)
        paint.color = Color.WHITE
        paint.textSize  = size * 0.36f
        paint.textAlign = Paint.Align.CENTER
        paint.isFakeBoldText = true
        val y = (size / 2f) - (paint.ascent() + paint.descent()) / 2f
        canvas.drawText(initials.ifEmpty { "?" }, size / 2f, y, paint)
        return bmp
    }
}
