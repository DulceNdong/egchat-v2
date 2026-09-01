package com.egchat.app.modules

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
import com.egchat.app.MainActivity
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.net.URL

/**
 * EGChat — Notificaciones ricas Android (MessagingStyle)
 * Equivalente al comportamiento automático de UNNotificationServiceExtension en iOS.
 *
 * Muestra:
 *  - Avatar del remitente en la notificación
 *  - Estilo "conversación" de Android (MessagingStyle)
 *  - BigPicture si el mensaje es una imagen
 *  - Agrupación por chat (stacking de mensajes del mismo chat)
 */
class EGChatRichNotification(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "EGChatRichNotification"
        private const val CHANNEL_ID_MESSAGES = "egchat-messages"
        private const val CHANNEL_NAME_MESSAGES = "Mensajes EGChat"
    }

    init {
        createChannels()
    }

    override fun getName(): String = NAME

    // ── Crear canales (Android 8+) ────────────────────────────────────────

    private fun createChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = reactContext.getSystemService(NotificationManager::class.java)

            val messagesChannel = NotificationChannel(
                CHANNEL_ID_MESSAGES,
                CHANNEL_NAME_MESSAGES,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Mensajes recibidos en EGChat"
                enableVibration(true)
                setShowBadge(true)
            }
            manager.createNotificationChannel(messagesChannel)
        }
    }

    // ── API para React Native ─────────────────────────────────────────────

    /**
     * Muestra una notificación rica con MessagingStyle.
     * payload: { notifId, chatId, senderName, senderAvatar, messageText,
     *            messageType, imageUrl, isGroup, groupName }
     */
    @ReactMethod
    fun showMessageNotification(payload: ReadableMap) {
        Thread {
            try {
                val notifId    = payload.getInt("notifId")
                val chatId     = payload.getString("chatId") ?: return@Thread
                val senderName = payload.getString("senderName") ?: "Desconocido"
                val avatarUrl  = payload.getString("senderAvatar") ?: ""
                val text       = payload.getString("messageText") ?: ""
                val msgType    = payload.getString("messageType") ?: "text"
                val imageUrl   = payload.getString("imageUrl") ?: ""
                val isGroup    = payload.getBoolean("isGroup")
                val groupName  = payload.getString("groupName") ?: ""

                // Descargar avatar si existe
                val avatarBitmap: Bitmap? = if (avatarUrl.isNotEmpty()) {
                    try { BitmapFactory.decodeStream(URL(avatarUrl).openStream()) }
                    catch (e: Exception) { null }
                } else null

                // Construir Person con avatar
                val personIcon = avatarBitmap?.let { IconCompat.createWithBitmap(it) }
                val sender = Person.Builder()
                    .setName(senderName)
                    .apply { if (personIcon != null) setIcon(personIcon) }
                    .build()

                // MessagingStyle — aparece como conversación de chat
                val style = NotificationCompat.MessagingStyle(sender)
                if (isGroup && groupName.isNotEmpty()) {
                    style.conversationTitle = groupName
                    style.isGroupConversation = true
                }

                val displayText = when (msgType) {
                    "image" -> "\uD83D\uDCF7 Foto"
                    "audio" -> "\uD83C\uDFA4 Audio"
                    "video" -> "\uD83C\uDFA5 Vídeo"
                    "file"  -> "\uD83D\uDCC4 Archivo"
                    else    -> text
                }
                style.addMessage(
                    NotificationCompat.MessagingStyle.Message(
                        displayText,
                        System.currentTimeMillis(),
                        sender
                    )
                )

                // Intent para abrir el chat al tocar
                val openIntent = Intent(reactContext, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("chatId", chatId)
                    putExtra("action", "open_chat")
                }
                val openPending = PendingIntent.getActivity(
                    reactContext, notifId, openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                val builder = NotificationCompat.Builder(reactContext, CHANNEL_ID_MESSAGES)
                    .setSmallIcon(android.R.drawable.ic_dialog_email)
                    .setStyle(style)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
                    .setAutoCancel(true)
                    .setContentIntent(openPending)
                    .setColor(0xFF00C8A0.toInt())
                    .setGroup("egchat_messages_$chatId")

                // Adjuntar imagen si es mensaje de foto
                if (msgType == "image" && imageUrl.isNotEmpty()) {
                    try {
                        val imgBitmap = BitmapFactory.decodeStream(URL(imageUrl).openStream())
                        builder.setStyle(
                            NotificationCompat.BigPictureStyle()
                                .bigPicture(imgBitmap)
                                .bigLargeIcon(null as Bitmap?)
                                .setSummaryText(senderName)
                        )
                    } catch (e: Exception) {
                        // Fallback a MessagingStyle si falla la descarga
                    }
                }

                NotificationManagerCompat.from(reactContext).notify(notifId, builder.build())

            } catch (e: Exception) {
                // Log silencioso — no crashear la app
            }
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
}
