package com.egchat.app

import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject

private const val CALL_CHANNEL = "egchat-calls-v2"
private const val MESSAGE_CHANNEL = "egchat-messages"
private const val PENDING_CALL = "egchat_pending_call_native"
private const val PENDING_ACTION = "egchat_pending_call_action_native"
private const val ACTION_CALL = "com.egchat.app.CALL_ACTION"

internal object EGChatCallNotifier {
  fun storePendingCall(context: Context, data: Map<String, String>) {
    val payload = JSONObject().apply {
      put("callId", data["callId"] ?: "")
      put("callerName", data["callerName"] ?: "EGCHAT")
      put("callerAvatar", data["callerAvatar"] ?: "")
      put("callType", data["callType"] ?: "audio")
      put("offer", data["offer"] ?: "")
      put("timestamp", System.currentTimeMillis())
    }.toString()
    context.getSharedPreferences("egchat_calls", Context.MODE_PRIVATE)
      .edit().putString(PENDING_CALL, payload).apply()
  }

  fun showIncomingCall(context: Context, data: Map<String, String>) {
    val callId = data["callId"] ?: return
    storePendingCall(context, data)
    createChannel(context)

    val fullScreenIntent = Intent(context, EGChatIncomingCallActivity::class.java).apply {
      putExtra("callId", callId)
      putExtra("callerName", data["callerName"] ?: "EGCHAT")
      putExtra("callType", data["callType"] ?: "audio")
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    val fullScreenPendingIntent = PendingIntent.getActivity(
      context, callId.hashCode(), fullScreenIntent, pendingIntentFlags()
    )
    val rejectIntent = actionIntent(context, callId, "reject")
    val answerIntent = actionIntent(context, callId, "answer")
    val title = if (data["callType"] == "video") "Videollamada entrante" else "Llamada entrante"

    val notification = NotificationCompat.Builder(context, CALL_CHANNEL)
      .setSmallIcon(com.egchat.app.R.drawable.notification_icon)
      .setContentTitle(title)
      .setContentText(data["callerName"] ?: "EGCHAT")
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setFullScreenIntent(fullScreenPendingIntent, true)
      .setContentIntent(fullScreenPendingIntent)
      .addAction(0, "Rechazar", rejectIntent)
      .addAction(0, "Contestar", answerIntent)
      .build()

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
      context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
      NotificationManagerCompat.from(context).notify(callId.hashCode(), notification)
    }
  }

  fun clear(context: Context, callId: String) {
    NotificationManagerCompat.from(context).cancel(callId.hashCode())
  }

  fun recordCallAction(context: Context, callId: String, action: String) {
    val preferences = context.getSharedPreferences("egchat_calls", Context.MODE_PRIVATE)
    val pendingCall = preferences.getString(PENDING_CALL, null)
    if (pendingCall != null) {
      runCatching { JSONObject(pendingCall) }
        .getOrNull()
        ?.put("action", action)
        ?.put("actionTimestamp", System.currentTimeMillis())
        ?.let { preferences.edit().putString(PENDING_CALL, it.toString()).apply() }
    }
  }

  fun showMessageNotification(context: Context, data: Map<String, String>, title: String?, body: String?) {
    createMessageChannel(context)
    val safeTitle = title?.takeIf { it.isNotBlank() } ?: data["senderName"] ?: "EGCHAT"
    val safeBody = body?.takeIf { it.isNotBlank() } ?: data["body"] ?: "Nuevo mensaje"
    val chatId = data["chatId"]
    val openIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      putExtra("chatId", chatId)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    val contentIntent = openIntent?.let {
      PendingIntent.getActivity(context, (chatId ?: safeBody).hashCode(), it, pendingIntentFlags())
    }
    val notification = NotificationCompat.Builder(context, MESSAGE_CHANNEL)
      .setSmallIcon(com.egchat.app.R.drawable.notification_icon)
      .setContentTitle(safeTitle)
      .setContentText(safeBody)
      .setStyle(NotificationCompat.BigTextStyle().bigText(safeBody))
      .setCategory(NotificationCompat.CATEGORY_MESSAGE)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setAutoCancel(true)
      .setContentIntent(contentIntent)
      .build()

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
      context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
      NotificationManagerCompat.from(context).notify((chatId ?: safeBody).hashCode(), notification)
    }
  }

  private fun createChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(CALL_CHANNEL, "Llamadas", NotificationManager.IMPORTANCE_MAX).apply {
      description = "Llamadas entrantes de EGCHAT"
      lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 500, 200, 500)
      setBypassDnd(true)
    }
    context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }

  private fun createMessageChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(MESSAGE_CHANNEL, "Mensajes", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Mensajes nuevos de EGCHAT"
      lockscreenVisibility = android.app.Notification.VISIBILITY_PRIVATE
    }
    context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }

  private fun actionIntent(context: Context, callId: String, action: String): PendingIntent {
    val intent = Intent(context, EGChatCallActionReceiver::class.java).apply {
      this.action = ACTION_CALL
      putExtra("callId", callId)
      putExtra("action", action)
    }
    return PendingIntent.getBroadcast(context, (callId + action).hashCode(), intent, pendingIntentFlags())
  }

  private fun pendingIntentFlags(): Int =
    PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
}

class EGChatFirebaseMessagingService : FirebaseMessagingService() {
  override fun onMessageReceived(message: RemoteMessage) {
    val data = message.data
    if (data["notificationType"] == "incoming_call" && !data["callId"].isNullOrBlank()) {
      EGChatCallNotifier.showIncomingCall(this, data)
    } else {
      EGChatCallNotifier.showMessageNotification(this, data, message.notification?.title, message.notification?.body)
    }
  }

  override fun onNewToken(token: String) {
    getSharedPreferences("egchat_calls", Context.MODE_PRIVATE).edit().putString("fcm_token", token).apply()
  }
}

class EGChatCallActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val callId = intent.getStringExtra("callId") ?: return
    val action = intent.getStringExtra("action") ?: return
    val payload = JSONObject().put("callId", callId).put("action", action).put("timestamp", System.currentTimeMillis()).toString()
    context.getSharedPreferences("egchat_calls", Context.MODE_PRIVATE).edit().putString(PENDING_ACTION, payload).apply()
    EGChatCallNotifier.recordCallAction(context, callId, action)
    EGChatCallNotifier.clear(context, callId)
    if (action == "answer") {
      context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { launchIntent ->
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        context.startActivity(launchIntent)
      }
    }
  }
}

class EGChatIncomingCallActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }
    val callId = intent.getStringExtra("callId") ?: run { finish(); return }
    val callerName = intent.getStringExtra("callerName") ?: "EGCHAT"
    val callType = intent.getStringExtra("callType") ?: "audio"
    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(48, 48, 48, 48)
      setBackgroundColor(Color.rgb(15, 34, 56))
    }
    root.addView(TextView(this).apply {
      text = if (callType == "video") "Videollamada entrante" else "Llamada entrante"
      textSize = 20f
      setTextColor(Color.WHITE)
      gravity = Gravity.CENTER
    })
    root.addView(TextView(this).apply {
      text = callerName
      textSize = 30f
      setTextColor(Color.WHITE)
      gravity = Gravity.CENTER
      setPadding(0, 24, 0, 48)
    })
    root.addView(Button(this).apply {
      text = "Contestar"
      setOnClickListener { sendAction(callId, "answer") }
    })
    root.addView(Button(this).apply {
      text = "Rechazar"
      setOnClickListener { sendAction(callId, "reject") }
    })
    setContentView(root)
  }

  private fun sendAction(callId: String, action: String) {
    sendBroadcast(Intent(this, EGChatCallActionReceiver::class.java).apply {
      this.action = ACTION_CALL
      putExtra("callId", callId)
      putExtra("action", action)
    })
    finish()
  }
}

class EGChatCallModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "EGChatCallModule"

  @ReactMethod fun addListener(eventName: String) { }
  @ReactMethod fun removeListeners(count: Int) { }

  @ReactMethod fun showIncomingCall(callerName: String, callerAvatar: String, callId: String, isVideo: Boolean) {
    EGChatCallNotifier.showIncomingCall(context, mapOf("callerName" to callerName, "callerAvatar" to callerAvatar, "callId" to callId, "callType" to if (isVideo) "video" else "audio"))
  }

  @ReactMethod fun dismissIncomingCall() { }
  @ReactMethod fun answerCall(callId: String) { }
  @ReactMethod fun rejectCall(callId: String) { EGChatCallNotifier.clear(context, callId) }
  @ReactMethod fun endCall(callId: String) { EGChatCallNotifier.clear(context, callId) }
  @ReactMethod fun startCallForegroundService(callId: String, callerName: String, isVideo: Boolean) { }
  @ReactMethod fun stopCallForegroundService() { }

  @ReactMethod fun getAndClearPendingCall(promise: Promise) {
    val preferences = context.getSharedPreferences("egchat_calls", Context.MODE_PRIVATE)
    val value = preferences.getString(PENDING_CALL, null)
    preferences.edit().remove(PENDING_CALL).apply()
    promise.resolve(value)
  }

  @ReactMethod fun getAndClearPendingCallAction(promise: Promise) {
    val preferences = context.getSharedPreferences("egchat_calls", Context.MODE_PRIVATE)
    val value = preferences.getString(PENDING_ACTION, null)
    preferences.edit().remove(PENDING_ACTION).apply()
    promise.resolve(value)
  }

  @ReactMethod fun getFcmToken(promise: Promise) {
    FirebaseMessaging.getInstance().token
      .addOnSuccessListener { token -> promise.resolve(token) }
      .addOnFailureListener { error -> promise.reject("FCM_TOKEN", error) }
  }
}

class EGChatCallPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) = listOf(EGChatCallModule(reactContext))
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
