package com.egchat.app.modules

import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class EGChatKeyboardViewManager : SimpleViewManager<EGChatKeyboardView>() {
    override fun getName(): String = "EGChatKeyboardView"

    override fun createViewInstance(reactContext: ThemedReactContext): EGChatKeyboardView {
        return EGChatKeyboardView(reactContext)
    }

    @ReactProp(name = "text")
    fun setText(view: EGChatKeyboardView, text: String?) {
        view.setTextValue(text)
    }

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "topChangeText" to mapOf("registrationName" to "onChangeText"),
            "topSubmit" to mapOf("registrationName" to "onSubmit")
        )
    }
}

