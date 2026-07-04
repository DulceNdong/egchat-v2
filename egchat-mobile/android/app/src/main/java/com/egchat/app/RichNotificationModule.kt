package com.egchat.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.graphics.drawable.IconCompat
import com.facebook.react.bridge.*
import java.net.URL

/**
 * EGChat — Notificaciones ricas con imagen (Android)
 *
 * Soporta:
 *   - Mensajes de texto con avatar del remitente
 *   - Mensajes con imagen adjunta (miniatura en la notificación)
 *   - Mensajes de audio con icono de micrófono
 *   - Agrupación de mensajes del mismo chat
 *   - Estilo MessagingStyle (igual que WhatsApp)
 */
class RichNotificationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val CHANNEL_MESSAGES = "egchat-messages"
        const val CHANNEL_GROUP = "egchat-group"
    }

    override fun getName() = "EGChatRichNotification"

    init { createChannels() }

    private fun createChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Canal mensajes individuales
            NotificationChannel(
                CHANNEL_MESSAGES, "Mensajes EGChat",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Mensajes de chats individuales"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 100, 250)
            }.also { nm.createNotificationChannel(it) }

            // Canal grupos
            NotificationChannel(
                CHANNEL_GROUP, "Grupos EGChat",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Mensajes de grupos"
                enableVibration(true)
            }.also { nm.createNotificationChannel(it) }
        }
    }

    /**
     * Muestra una notificación rica de mensaje
     *
     * @param data ReadableMap con:
     *   - notifId: Int — ID único para agrupar por chat
     *   - chatId: String
     *   - senderName: String
     *   - senderAvatar: String? (URL)
     *   - messageText: String
     *   - messageType: "text" | "image" | "audio" | "video" | "file"
     *   - imageUrl: String? (URL de la imagen para mostrar en notif)
     *   - isGroup: Boolean
     *   - groupName: String?
     */
    @ReactMethod
    fun showMessageNotification(data: ReadableMap) {
        val ctx = reactContext.applicationContext
        val notifId = if (data.hasKey("notifId")) data.getInt("notifId") else data.getString("chatId").hashCode()
        val chatId = data.getString("chatId") ?: return
        val senderName = data.getString("senderName") ?: "EGChat"
        val senderAvatar = if (data.hasKey("senderAvatar")) data.getString("senderAvatar") else null
        val messageText = data.getString("messageText") ?: ""
        val messageType = if (data.hasKey("messageType")) data.getString("messageType") else "text"
        val imageUrl = if (data.hasKey("imageUrl")) data.getString("imageUrl") else null
        val isGroup = data.hasKey("isGroup") && data.getBoolean("isGroup")
        val groupName = if (data.hasKey("groupName")) data.getString("groupName") else null

        // Intent para abrir el chat
        val openIntent = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("chatId", chatId)
            action = "OPEN_CHAT"
        }
        val openPi = PendingIntent.getActivity(
            ctx, notifId, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Cargar avatar del remitente en hilo de fondo
        Thread {
            val avatarBitmap: Bitmap? = senderAvatar?.let { loadBitmapFromUrl(it, 128) }

            // Construir Person (sender)
            val senderPerson = Person.Builder()
                .setName(senderName)
                .apply {
                    if (avatarBitmap != null) {
                        setIcon(IconCompat.createWithBitmap(
                            Bitmap.createScaledBitmap(avatarBitmap, 128, 128, true)
                        ))
                    }
                }
                .build()

            // Texto del mensaje según tipo
            val displayText = when (messageType) {
                "image" -> "📷 Foto"
                "audio" -> "🎵 Mensaje de voz"
                "video" -> "🎥 Video"
                "file"  -> "📄 Archivo"
                else    -> messageText
            }

            // Estilo MessagingStyle — igual que WhatsApp
            val style = NotificationCompat.MessagingStyle(senderPerson)
                .setConversationTitle(if (isGroup) groupName else null)
                .addMessage(displayText, System.currentTimeMillis(), senderPerson)

            val channelId = if (isGroup) CHANNEL_GROUP else CHANNEL_MESSAGES
            val title = if (isGroup) "${groupName ?: "Grupo"}" else senderName

            val builder = NotificationCompat.Builder(ctx, channelId)
                .setSmallIcon(R.drawable.notification_icon)
                .setContentTitle(title)
                .setContentText(displayText)
                .setStyle(style)
                .setContentIntent(openPi)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
                .setGroup("egchat_$chatId")

            // Si hay imagen adjunta, mostrar miniatura grande
            if (messageType == "image" && imageUrl != null) {
                val imageBitmap = loadBitmapFromUrl(imageUrl, 512)
                if (imageBitmap != null) {
                    builder.setStyle(
                        NotificationCompat.BigPictureStyle()
                            .bigPicture(imageBitmap)
                            .setSummaryText(senderName)
                    )
                    builder.setLargeIcon(imageBitmap)
                }
            } else if (avatarBitmap != null) {
                // Avatar como icono grande
                builder.setLargeIcon(
                    Bitmap.createScaledBitmap(avatarBitmap, 128, 128, true)
                )
            }

            val nm = NotificationManagerCompat.from(ctx)
            try {
                nm.notify(notifId, builder.build())
            } catch (_: SecurityException) {}

        }.start()
    }

    @ReactMethod
    fun dismissNotification(notifId: Int) {
        NotificationManagerCompat.from(reactContext).cancel(notifId)
    }

    @ReactMethod
    fun dismissAllNotifications() {
        NotificationManagerCompat.from(reactContext).cancelAll()
    }

    /** Descarga un Bitmap desde una URL con timeout */
    private fun loadBitmapFromUrl(url: String, maxSize: Int): Bitmap? {
        return try {
            val connection = URL(url).openConnection().apply {
                connectTimeout = 3000
                readTimeout = 3000
            }
            val raw = BitmapFactory.decodeStream(connection.getInputStream())
            if (raw != null && (raw.width > maxSize || raw.height > maxSize)) {
                val scale = maxSize.toFloat() / maxOf(raw.width, raw.height)
                Bitmap.createScaledBitmap(raw, (raw.width * scale).toInt(), (raw.height * scale).toInt(), true)
            } else raw
        } catch (_: Exception) { null }
    }
}
