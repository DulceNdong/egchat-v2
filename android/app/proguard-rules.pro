# ── EGCHAT ProGuard Rules ─────────────────────────────────────────────────────

# Preservar información de línea para debugging de crashes
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Capacitor ─────────────────────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
    @com.getcapacitor.PluginMethod <methods>;
}

# ── Plugins EGCHAT ────────────────────────────────────────────────────────────
-keep class com.egchat.app.** { *; }

# ── Firebase / FCM ────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── WebView JavaScript Interface ──────────────────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── call-screen plugin ────────────────────────────────────────────────────────
-keep class com.goalplay.callscreen.** { *; }

# ── Capawesome plugins ────────────────────────────────────────────────────────
-keep class io.capawesome.capacitorjs.** { *; }

# ── AndroidX ──────────────────────────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── Kotlin ────────────────────────────────────────────────────────────────────
-keep class kotlin.** { *; }
-dontwarn kotlin.**
