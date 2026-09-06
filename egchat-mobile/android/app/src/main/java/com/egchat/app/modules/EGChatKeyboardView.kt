package com.egchat.app.modules

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.view.HapticFeedbackConstants
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter

class EGChatKeyboardView(context: Context) : LinearLayout(context) {
    private var currentText = ""
    private var numbers = false
    private var uppercase = false

    private val lettersRows = listOf(
        listOf("q", "w", "e", "r", "t", "y", "u", "i", "o", "p"),
        listOf("a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"),
        listOf("⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"),
        listOf("123", "espacio", "intro"),
    )

    private val numberRows = listOf(
        listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "0"),
        listOf("-", "/", ":", ";", "(", ")", "€", "&", "@", "\""),
        listOf("ABC", ".", ",", "?", "!", "'", "⌫"),
        listOf("ABC", "espacio", "intro"),
    )

    init {
        orientation = VERTICAL
        gravity = Gravity.CENTER
        setBackgroundColor(Color.rgb(199, 204, 214))
        setPadding(dp(6), dp(8), dp(6), dp(6))
        renderKeys()
    }

    fun setTextValue(value: String?) {
        currentText = value ?: ""
    }

    private fun renderKeys() {
        removeAllViews()
        val rows = if (numbers) numberRows else lettersRows
        rows.forEach { keys ->
            val row = LinearLayout(context)
            row.orientation = HORIZONTAL
            row.gravity = Gravity.CENTER
            row.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, 0, 1f).apply {
                bottomMargin = dp(7)
            }

            keys.forEach { key ->
                row.addView(makeButton(key))
            }

            addView(row)
        }
    }

    private fun makeButton(key: String): Button {
        return Button(context).apply {
            text = displayTitle(key)
            textSize = if (key.length == 1) 21f else 15f
            typeface = Typeface.DEFAULT
            isAllCaps = false
            setTextColor(Color.BLACK)
            background = keyBackground(isSpecial(key))
            minHeight = 0
            minWidth = 0
            includeFontPadding = false
            stateListAnimator = null
            setPadding(0, 0, 0, 0)
            layoutParams = LinearLayout.LayoutParams(0, LayoutParams.MATCH_PARENT, widthWeight(key)).apply {
                leftMargin = dp(3)
                rightMargin = dp(3)
            }
            setOnClickListener { handle(key) }
        }
    }

    private fun keyBackground(special: Boolean): GradientDrawable {
        return GradientDrawable().apply {
            setColor(if (special) Color.rgb(173, 184, 197) else Color.WHITE)
            cornerRadius = dp(7).toFloat()
        }
    }

    private fun isSpecial(key: String) =
        key == "123" || key == "ABC" || key == "⌫" || key == "⇧" || key == "intro"

    private fun displayTitle(key: String): String {
        return if (!numbers && key.length == 1 && uppercase) key.uppercase() else key
    }

    private fun widthWeight(key: String): Float {
        return when (key) {
            "espacio" -> 5.6f
            "intro" -> 2.2f
            "123", "ABC" -> 2.0f
            "⇧", "⌫" -> 1.5f
            else -> 1f
        }
    }

    private fun handle(key: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        } else {
            performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
        }

        when (key) {
            "123" -> {
                numbers = true
                renderKeys()
            }
            "ABC" -> {
                numbers = false
                renderKeys()
            }
            "⇧" -> {
                uppercase = !uppercase
                renderKeys()
            }
            "⌫" -> {
                if (currentText.isNotEmpty()) {
                    currentText = currentText.dropLast(1)
                    emitChange()
                }
            }
            "espacio" -> {
                currentText += " "
                emitChange()
            }
            "intro" -> emitSubmit()
            else -> {
                currentText += if (!numbers && uppercase) key.uppercase() else key
                if (!numbers && uppercase) {
                    uppercase = false
                    renderKeys()
                }
                emitChange()
            }
        }
    }

    private fun emitChange() {
        val event = Arguments.createMap().apply {
            putString("text", currentText)
        }
        (context as ThemedReactContext)
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, "topChangeText", event)
    }

    private fun emitSubmit() {
        (context as ThemedReactContext)
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, "topSubmit", Arguments.createMap())
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }
}

