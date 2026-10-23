package com.egchat.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.graphics.drawable.IconCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.net.URL

/**
 * EGChat — Notificaciones ricas Android (MessagingStyle)
 *
 * Muestra el avatar circular del remitente en la notificación usando
 * MessagingStyle (estilo "conversación" igual que WhatsApp/Telegram).
 * Cada chat tiene su propio grupo de notificaciones para que se
 * apilen correctamente y al tocar lleven directamente al chat.
 *
 * También se usa desde EGChatFirebaseMessagingService cuando el FCM
 * llega con la app en background/cerrada.
 */
class EGChatRichNotification(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "EGChatRichNotification"
        private const val CHANNEL_MESSAGES = "egchat-messages"
        private const val CHANNEL_MESSAGES_NAME = "Mensajes"

        // Cache de avatares en memoria (clave: URL)
        private val avatarCache = HashMap<String, Bitmap>()

        /** Descarga un avatar y lo recorta en círculo */
        fun fetchCircularAvatar(url: String): Bitmap? {
            if (url.isBlank()) return null
            avatarCache[url]?.let { return it }
            return try {
                val raw = BitmapFactory.decodeStream(URL(url).openStream()) ?: return null
                val circular = toCircularBitmap(raw)
                avatarCache[url] = circular
                circular
            } catch (e: Exception) { null }
        }

        private fun toCircularBitmap(src: Bitmap): Bitmap {
            val size = minOf(src.width, src.height)
            val output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(output)
            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            val rect = Rect(0, 0, size, size)
            canvas.drawOval(RectF(rect), paint)
            paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
            // Centrar el bitmap original
            val xOffset = (src.width - size) / 2
            val yOffset = (src.height - size) / 2
            canvas.drawBitmap(src, Rect(xOffset, yOffset, xOffset + size, yOffset + size), rect, paint)
            return output
        }

        fun createMessageChannel(context: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val manager = context.getSystemService(NotificationManager::class.java) ?: return
            if (manager.getNotificationChannel(CHANNEL_MESSAGES) != null) return
            val channel = NotificationChannel(
                CHANNEL_MESSAGES,
                CHANNEL_MESSAGES_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Mensajes nuevos de EGChat"
                enableVibration(true)
                setShowBadge(true)
            }
            manager.createNotificationChannel(channel)
        }

        /**
         * Muestra una notificación rica con MessagingStyle desde cualquier contexto
         * (usado directamente por FirebaseMessagingService en background).
         */
        fun showFromBackground(context: Context, data: Map<String, String>, title: String?, body: String?) {
            createMessageChannel(context)

            val chatId     = data["chatId"] ?: data["chat_id"] ?: return
            val senderName = title ?: data["senderName"] ?: "EGChat"
            val text       = body  ?: data["messageText"] ?: data["body"] ?: "Nuevo mensaje"
            val avatarUrl  = data["senderAvatar"] ?: data["imageUrl"] ?: ""
            val msgType    = data["messageType"] ?: "text"
            val notifId    = chatId.hashCode()

            val avatarBitmap: Bitmap? = try { fetchCircularAvatar(avatarUrl) } catch (e: Exception) { null }

            val personBuilder = Person.Builder().setName(senderName)
            avatarBitmap?.let { personBuilder.setIcon(IconCompat.createWithBitmap(it)) }
            val sender = personBuilder.build()

            val displayText = when (msgType) {
                "image"  -> "📷 Foto"
                "audio"  -> "🎤 Audio"
                "video"  -> "🎥 Vídeo"
                "file"   -> "📄 Archivo"
                else     -> text
            }

            val style = NotificationCompat.MessagingStyle(sender)
            style.addMessage(
                NotificationCompat.MessagingStyle.Message(
                    displayText, System.currentTimeMillis(), sender
                )
            )

            val openIntent = context.packageManager
                .getLaunchIntentForPackage(context.packageName)?.apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("chatId", chatId)
                    putExtra("action", "open_chat")
                }
            val pending = openIntent?.let {
                PendingIntent.getActivity(
                    context, notifId, it,
                    PendingIntent.FLAG_UPDATE_CURRENT or
                    (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )
            }

            val notification = NotificationCompat.Builder(context, CHANNEL_MESSAGES)
                .setSmallIcon(context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
                    .takeIf { it != 0 } ?: android.R.drawable.ic_popup_reminder)
                .setStyle(style)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setAutoCancel(true)
                .setContentIntent(pending)
                .setColor(0xFF00C8A0.toInt())
                .setGroup("egchat_chat_$chatId")
                .build()

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED
            ) {
                NotificationManagerCompat.from(context).notify(notifId, notification)
            }
        }
    }

    override fun getName() = NAME

    // ── API React Native (llamada desde JS cuando la app está en primer plano) ──

    /**
     * payload: {
     *   notifId: Int,
     *   chatId: String,
     *   senderName: String,
     *   senderAvatar: String (URL),
     *   messageText: String,
     *   messageType: "text"|"image"|"audio"|"video"|"file",
     *   imageUrl: String,
     *   isGroup: Boolean,
     *   groupName: String
     * }
     */
    @ReactMethod
    fun showMessageNotification(payload: ReadableMap) {
        Thread {
            try {
                val notifId    = payload.getInt("notifId")
                val chatId     = payload.getString("chatId") ?: return@Thread
                val senderName = payload.getString("senderName") ?: "EGChat"
                val avatarUrl  = payload.getString("senderAvatar") ?: ""
                val text       = payload.getString("messageText") ?: ""
                val msgType    = payload.getString("messageType") ?: "text"
                val imageUrl   = payload.getString("imageUrl") ?: ""
                val isGroup    = if (payload.hasKey("isGroup")) payload.getBoolean("isGroup") else false
                val groupName  = payload.getString("groupName") ?: ""

                createMessageChannel(reactContext)

                // Descargar avatar circular
                val avatarBitmap: Bitmap? = try { fetchCircularAvatar(avatarUrl) } catch (e: Exception) { null }

                val personBuilder = Person.Builder().setName(senderName)
                avatarBitmap?.let { personBuilder.setIcon(IconCompat.createWithBitmap(it)) }
                val sender = personBuilder.build()

                // MessagingStyle: aparece como burbuja de conversación
                val style = NotificationCompat.MessagingStyle(sender)
                if (isGroup && groupName.isNotEmpty()) {
                    style.conversationTitle = groupName
                    style.isGroupConversation = true
                }

                val displayText = when (msgType) {
                    "image"  -> "📷 Foto"
                    "audio"  -> "🎤 Audio"
                    "video"  -> "🎥 Vídeo"
                    "file"   -> "📄 Archivo"
                    else     -> text
                }
                style.addMessage(
                    NotificationCompat.MessagingStyle.Message(
                        displayText, System.currentTimeMillis(), sender
                    )
                )

                // Intent: al tocar va directo al chat
                val openIntent = Intent(reactContext, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("chatId", chatId)
                    putExtra("action", "open_chat")
                }
                val pending = PendingIntent.getActivity(
                    reactContext, notifId, openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or
                    (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )

                val builder = NotificationCompat.Builder(reactContext, CHANNEL_MESSAGES)
                    .setSmallIcon(
                        reactContext.resources.getIdentifier("notification_icon", "drawable", reactContext.packageName)
                            .takeIf { it != 0 } ?: android.R.drawable.ic_popup_reminder
                    )
                    .setStyle(style)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .setAutoCancel(true)
                    .setContentIntent(pending)
                    .setColor(0xFF00C8A0.toInt())  // verde EGCHAT
                    .setGroup("egchat_chat_$chatId")

                // BigPicture si el mensaje es una foto
                if (msgType == "image" && imageUrl.isNotEmpty()) {
                    try {
                        val img = BitmapFactory.decodeStream(URL(imageUrl).openStream())
                        if (img != null) {
                            builder.setStyle(
                                NotificationCompat.BigPictureStyle()
                                    .bigPicture(img)
                                    .bigLargeIcon(null as Bitmap?)
                                    .setSummaryText(senderName)
                            )
                        }
                    } catch (_: Exception) { /* fallback a MessagingStyle */ }
                }

                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                    reactContext.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) ==
                    android.content.pm.PackageManager.PERMISSION_GRANTED
                ) {
                    NotificationManagerCompat.from(reactContext).notify(notifId, builder.build())
                }

            } catch (_: Exception) { /* silencioso */ }
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
