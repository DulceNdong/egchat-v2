package com.egchat.app.modules

import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * EGChat — Módulo para recibir contenido compartido desde otras apps (Android)
 * Equivalente al EGChatShareModule.swift de iOS.
 *
 * Android usa el sistema de Intents para compartir contenido.
 * MainActivity captura el Intent ACTION_SEND y llama a EGChatShareModule.handleIntent().
 *
 * Soporta:
 *  - Texto compartido
 *  - Una imagen o archivo
 *  - Múltiples archivos (ACTION_SEND_MULTIPLE)
 */
class EGChatShareModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "EGChatShareModule"

        @Volatile
        var instance: EGChatShareModule? = null

        // Almacena el contenido pendiente hasta que JS lo consulte
        @Volatile
        private var pendingContent: Map<String, Any?>? = null
    }

    init {
        instance = this
    }

    override fun getName(): String = NAME

    // ── Llamado desde MainActivity cuando recibe un Intent de share ──────

    fun handleIntent(intent: Intent) {
        val content = parseIntent(intent) ?: return
        pendingContent = content

        // Si la app ya está corriendo, emitir el evento directamente
        try {
            val params = Arguments.createMap()
            content.forEach { (k, v) ->
                when (v) {
                    is String -> params.putString(k, v)
                    is Boolean -> params.putBoolean(k, v)
                    is List<*> -> {
                        val arr: WritableArray = Arguments.createArray()
                        @Suppress("UNCHECKED_CAST")
                        (v as List<Map<String, String>>).forEach { item ->
                            val itemMap = Arguments.createMap()
                            item.forEach { (ik, iv) -> itemMap.putString(ik, iv) }
                            arr.pushMap(itemMap)
                        }
                        params.putArray(k, arr)
                    }
                    null -> params.putNull(k)
                }
            }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("sharedContent", params)
        } catch (e: Exception) {
            // App no lista aún — JS lo leerá via getSharedContent()
        }
    }

    private fun parseIntent(intent: Intent): Map<String, Any?>? {
        return when (intent.action) {
            Intent.ACTION_SEND -> {
                // Texto plano compartido
                val text = intent.getStringExtra(Intent.EXTRA_TEXT)
                if (text != null) {
                    return mapOf("type" to "text", "text" to text)
                }

                // Archivo/imagen
                val uri = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra(Intent.EXTRA_STREAM)
                } ?: return null

                val mime = intent.type ?: "application/octet-stream"
                val type = when {
                    mime.startsWith("image/") -> "image"
                    mime.startsWith("video/") -> "video"
                    mime.startsWith("audio/") -> "audio"
                    else -> "file"
                }
                mapOf(
                    "type" to type,
                    "uri" to uri.toString(),
                    "mimeType" to mime
                )
            }

            Intent.ACTION_SEND_MULTIPLE -> {
                val uris = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM)
                } ?: return null

                val mime = intent.type ?: "application/octet-stream"
                val files = uris.map { uri ->
                    val fileType = when {
                        mime.startsWith("image/") -> "image"
                        mime.startsWith("video/") -> "video"
                        mime.startsWith("audio/") -> "audio"
                        else -> "file"
                    }
                    mapOf("type" to fileType, "uri" to uri.toString(), "mimeType" to mime)
                }
                mapOf("type" to "multiple", "files" to files)
            }

            else -> null
        }
    }

    // ── API para React Native ─────────────────────────────────────────────

    @ReactMethod
    fun getSharedContent(promise: Promise) {
        val content = pendingContent
        if (content == null) {
            promise.resolve(null)
            return
        }

        val result = Arguments.createMap()
        content.forEach { (k, v) ->
            when (v) {
                is String -> result.putString(k, v)
                is Boolean -> result.putBoolean(k, v)
                is List<*> -> {
                    val arr: WritableArray = Arguments.createArray()
                    @Suppress("UNCHECKED_CAST")
                    (v as List<Map<String, String>>).forEach { item ->
                        val itemMap = Arguments.createMap()
                        item.forEach { (ik, iv) -> itemMap.putString(ik, iv) }
                        arr.pushMap(itemMap)
                    }
                    result.putArray(k, arr)
                }
                null -> result.putNull(k)
            }
        }
        promise.resolve(result)
    }

    @ReactMethod
    fun clearSharedContent() {
        pendingContent = null
    }

    @ReactMethod
    fun addListener(eventName: String) { /* noop */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* noop */ }
}
