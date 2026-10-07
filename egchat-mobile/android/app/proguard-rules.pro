# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod <methods>; }

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Supabase / Ktor
-dontwarn io.ktor.**
-dontwarn kotlinx.serialization.**
-keep class kotlinx.serialization.** { *; }

# Expo modules
-keep class expo.modules.** { *; }
-keep class com.expo.** { *; }

# WebRTC
-keep class org.webrtc.** { *; }

# Maps
-keep class com.google.maps.** { *; }

# Add any project specific keep options here:
