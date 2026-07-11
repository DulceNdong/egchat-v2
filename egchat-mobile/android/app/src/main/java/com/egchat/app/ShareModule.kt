package com.egchat.app

import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Módulo stub para permitir la compilación.
 * El módulo de compartir contenido será restaurado después de resolver
 * los problemas de acceso a propiedades de ReactApplicationContext.
 */
class ShareModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "EGChatShareModule"

    @ReactMethod
    fun getSharedContent(promise: Promise) {
        promise.resolve(null)
    }

    @ReactMethod 
    fun addListener(eventName: String) {}

    @ReactMethod 
    fun removeListeners(count: Int) {}

    fun onNewIntent(intent: Intent) {
        // Stub implementación
    }
}
