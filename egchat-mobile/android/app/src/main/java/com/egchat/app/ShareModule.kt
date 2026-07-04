package com.egchat.app

import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * EGChat — Módulo para recibir contenido compartido desde otras apps.
 * El usuario abre una foto/video/archivo en otra app, toca "Compartir",
 * selecciona EGChat y la app se abre con el archivo listo para enviar.
 */
class ShareModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "EGChatShareModule"

    /** Devuelve el Intent de compartir recibido (si hay uno pendiente) */
    @ReactMethod
    fun getSharedContent(promise: Promise) {
        val activity = currentActivity
        val intent = activity?.intent

        if (intent == null || activity == null) {
            promise.resolve(null)
            return
        }

        val action = intent.action
        val type = intent.type ?: ""

        when {
            // Archivo/imagen/video único compartido
            action == Intent.ACTION_SEND -> {
                val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
                if (uri != null) {
                    val map = Arguments.createMap().apply {
                        putString("type", resolveType(type))
                        putString("uri", uri.toString())
                        putString("mimeType", type)
                        putString("text", intent.getStringExtra(Intent.EXTRA_TEXT) ?: "")
                    }
                    promise.resolve(map)
                    // Limpiar el intent para no recibirlo dos veces
                    activity.intent = Intent()
                    return
                }
                // Texto compartido
                val text = intent.getStringExtra(Intent.EXTRA_TEXT)
                if (text != null) {
                    val map = Arguments.createMap().apply {
                        putString("type", "text")
                        putString("text", text)
                        putString("uri", "")
                        putString("mimeType", "text/plain")
                    }
                    promise.resolve(map)
                    activity.intent = Intent()
                    return
                }
            }
            // Múltiples archivos compartidos
            action == Intent.ACTION_SEND_MULTIPLE -> {
                val uris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
                if (!uris.isNullOrEmpty()) {
                    val array = Arguments.createArray()
                    uris.forEach { uri ->
                        val item = Arguments.createMap().apply {
                            putString("type", resolveType(type))
                            putString("uri", uri.toString())
                            putString("mimeType", type)
                        }
                        array.pushMap(item)
                    }
                    val map = Arguments.createMap().apply {
                        putString("type", "multiple")
                        putArray("files", array)
                    }
                    promise.resolve(map)
                    activity.intent = Intent()
                    return
                }
            }
        }
        promise.resolve(null)
    }

    /** Emite evento cuando la app recibe un share mientras estaba abierta */
    fun onNewIntent(intent: Intent) {
        val action = intent.action
        val type = intent.type ?: ""

        if (action == Intent.ACTION_SEND || action == Intent.ACTION_SEND_MULTIPLE) {
            val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            val map = Arguments.createMap().apply {
                putString("type", resolveType(type))
                putString("uri", uri?.toString() ?: "")
                putString("mimeType", type)
                putString("text", intent.getStringExtra(Intent.EXTRA_TEXT) ?: "")
            }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("sharedContent", map)
        }
    }

    private fun resolveType(mimeType: String) = when {
        mimeType.startsWith("image/") -> "image"
        mimeType.startsWith("video/") -> "video"
        mimeType.startsWith("audio/") -> "audio"
        mimeType == "text/plain"      -> "text"
        else                          -> "file"
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
