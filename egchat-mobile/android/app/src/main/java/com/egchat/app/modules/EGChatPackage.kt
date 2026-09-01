package com.egchat.app.modules

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * EGChatPackage — registra todos los módulos nativos de EGChat para Android.
 *
 * Añadir en MainApplication.kt dentro de getPackages():
 *   add(EGChatPackage())
 */
class EGChatPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(
        EGChatCallModule(reactContext),
        EGChatRichNotification(reactContext),
        EGChatAudioRecorder(reactContext),
        EGChatShareModule(reactContext),
        EGChatFaceFilter(reactContext),
        EGChatWidgetModule(reactContext),
    )

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
