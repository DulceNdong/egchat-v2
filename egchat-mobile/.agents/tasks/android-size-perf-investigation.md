# Android APK Size & Performance Investigation

**Date:** 2025-07-30  
**APK analyzed:** `android/app/build/outputs/apk/release/app-release.apk` (153 MB on disk, 187 MB uncompressed)

---

## Summary Answer

The APK is ~165 MB because it bundles **native `.so` libraries for 4 CPU architectures at once** (armeabi-v7a, arm64-v8a, x86, x86_64), and two of those libraries are exceptionally large: **react-native-webrtc** (`libjingle_peerconnection_so.so`) and **react-native-maps** (`libbarhopper_v3.so` — Google Maps). Together those two alone account for 63 MB across all ABIs.

A real device only ever uses one architecture. If the APK were limited to `arm64-v8a` (covers ~99% of Android phones sold after 2019), the native-library layer would shrink from **124.5 MB → 32.2 MB**, a saving of **~92 MB**. That alone gets the APK under 65 MB without removing any feature.

Android feels slow primarily because **minification/R8 is disabled**, **4× redundant native code** inflates the install size (causing slow cold starts and more RAM pressure), and the chat FlatList is configured conservatively with very low `maxToRenderPerBatch` (4) and a high `scrollEventThrottle` (100 ms).

---

## APK Contents Breakdown

| Category | Size (uncompressed) |
|---|---|
| Native libs (all 4 ABIs) | **124.5 MB** |
| DEX bytecode | **37 MB** |
| Assets (JS bundle + ML models) | **6 MB** |
| Resources (res/, fonts, arsc) | **1.8 MB** |
| **Total** | **~170 MB** |

### Top native libraries across all ABIs

| Library | Total (all ABIs) | Owner |
|---|---|---|
| `libjingle_peerconnection_so.so` | **43.1 MB** | react-native-webrtc |
| `libreactnative.so` | 22.5 MB | React Native core |
| `libbarhopper_v3.so` | **20.2 MB** | react-native-maps (Google Maps) |
| `libhermes.so` | 8.5 MB | Hermes JS engine |
| `libappmodules.so` | 5.9 MB | Expo modules |
| `libexpo-modules-core.so` | 4.8 MB | Expo core |
| `libavif_android.so` | 4.7 MB | expo-image (AVIF decoder) |
| `libc++_shared.so` | 4.7 MB | C++ STL |

For `arm64-v8a` only (what a real phone uses):

| Library | arm64 size |
|---|---|
| `libjingle_peerconnection_so.so` | **10.9 MB** |
| `libreactnative.so` | 5.6 MB |
| `libbarhopper_v3.so` | 4.7 MB |
| `libhermes.so` | 2.0 MB |

---

## Findings by Question

### 1. Why is the APK 165 MB?

Three root causes stack on each other:

**A. 4 ABIs compiled into a single fat APK (biggest cause: ~92 MB wasted)**  
`android/gradle.properties` line:
```
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
```
This tells the build to include native `.so` files for all four architectures. Since WebRTC and Maps have very large native libraries, each of those is repeated four times. The `preview-slim` profile in `eas.json` sets an `ANDROID_ABI=arm64-v8a` environment variable, but this is **not wired up to Gradle** — it is just an env var that nothing reads. It has no effect on the build. The actual control is `reactNativeArchitectures` in `gradle.properties`.

**B. react-native-webrtc (43 MB across ABIs, 11 MB for arm64 alone)**  
`libjingle_peerconnection_so.so` is the libwebrtc native library. It is the single largest file in the APK. It is always included because `EXPO_PUBLIC_ENABLE_WEBRTC=1` in all EAS profiles and `metro.config.js` only stubs it when `EXPO_PUBLIC_ENABLE_WEBRTC=0` — which is never set. Even the `preview-slim` profile sets it to `1`.

**C. R8/ProGuard minification is disabled**  
`android/app/build.gradle`:
```groovy
def enableMinifyInReleaseBuilds = (findProperty('android.enableMinifyInReleaseBuilds') ?: false).toBoolean()
// ...
minifyEnabled enableMinifyInReleaseBuilds
```
`android.enableMinifyInReleaseBuilds` is not set in `gradle.properties`, so it defaults to `false`. R8 minification + shrink resources would reduce the DEX layer (37 MB) by an estimated 20–30%.

### 2. Is Hermes enabled?

**Yes.** Both in `gradle.properties`:
```
hermesEnabled=true
```
And in `app.json`:
```json
"android": { "jsEngine": "hermes" }
```
`libhermes.so` is present in the APK across all ABIs. The JS bundle (`assets/index.android.bundle`, 5.3 MB) is a Hermes bytecode file, confirming this is working correctly.

### 3. Is it a fat APK or split APKs?

**Fat APK (all ABIs in one file).** Evidence:
- `gradle.properties`: `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`
- The APK contains 100 `.so` files across 4 ABI directories: `lib/armeabi-v7a/`, `lib/arm64-v8a/`, `lib/x86/`, `lib/x86_64/`
- No `splits {}` block exists in `android/app/build.gradle`

The `production` profile in `eas.json` uses `"buildType": "app-bundle"` (AAB), which the Play Store uses to serve per-device APKs. But `preview` uses `"buildType": "apk"` — a fat APK.

### 4. Specific changes to reduce APK under 80 MB

**Change 1 (impact: ~92 MB reduction) — Restrict to arm64-v8a only in preview builds**

In `android/gradle.properties`, change:
```
# FROM:
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
# TO (for testing — real devices are arm64):
reactNativeArchitectures=arm64-v8a
```

Or, better, add to `eas.json` under `preview.android`:
```json
"gradleCommand": ":app:assembleRelease",
"env": {
  "GRADLE_OPTS": "... -PreactNativeArchitectures=arm64-v8a"
}
```
The `-P` flag overrides `gradle.properties` at build time, so the source file stays untouched.

**Change 2 (impact: ~8–12 MB reduction) — Enable R8 minification**

In `gradle.properties`:
```
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
```
You must also add ProGuard keep rules for Supabase and Firebase in `proguard-rules.pro` (see Recommendations below).

**Change 3 (impact: ~5 MB reduction) — Disable x86 simulators (expo.gif/webp in production)**

In `gradle.properties`:
```
expo.gif.enabled=false
expo.webp.enabled=false
```
GIF/WebP decoder native libs (`libgifimage.so`, `libstatic-webp.so`, `libnative-imagetranscoder.so`) add ~8 MB across ABIs, ~2.5 MB for arm64 alone.

**After changes 1 + 2 + 3, estimated final APK size:**
- Native libs: ~32 MB (arm64 only)
- DEX after R8: ~25 MB (estimated ~30% reduction)
- Assets + resources: ~8 MB
- **Total: ~65 MB** ✅

### 5. Specific changes to improve Android performance

**A. Chat FlatList — low `maxToRenderPerBatch` (4) causes visible blank rows on scroll**  
`app/chat/[id].tsx` line 2442:
```tsx
maxToRenderPerBatch={Platform.OS === 'android' ? 4 : 10}
```
Value of 4 is too conservative for modern devices. Increase to 8–10. At 4, fast scrolling produces blank frames before items render.

**B. Chat FlatList — high `scrollEventThrottle` (100 ms) means scroll position updates lag**  
`app/chat/[id].tsx` line 2436:
```tsx
scrollEventThrottle={Platform.OS === 'android' ? 100 : 16}
```
100 ms means 6 scroll events per second at best. The `showScrollBottom` button and read-receipt tracking both depend on `onScroll`. Use 32–50 ms.

**C. LayoutAnimation on keyboard show/hide — causes full layout re-calculation**  
`app/chat/[id].tsx` lines 453–466: on `keyboardDidShow`/`keyboardDidHide`, the code calls `LayoutAnimation.configureNext(easeInEaseOut)`. On Android, `LayoutAnimation` triggers a full native layout pass and can interact poorly with the FlatList, causing the messages to jump visually. This is why the list moves up and down. Replace with Animated API or, better, switch to `KeyboardAvoidingView behavior="height"` on Android (the screen already imports `KeyboardAvoidingView` on line 7 but does not use it — it is the `SafeAreaView` approach with manual keyboard tracking instead).

**D. `renderItem` has many dependencies in `useCallback` — still recreates frequently**  
`app/chat/[id].tsx` line 2297–2305: the `renderItem` `useCallback` depends on `messageReactions`, `selectedIds`, `isSelectMode`, `chatSearchQuery` and others. Each state change (typing, reactions, selection) recreates the function, which causes every visible row to re-render even when most messages didn't change. The `ChatMessageBubble` is correctly wrapped in `React.memo` (line 1594 of `ChatMessageBubble.tsx`) but the deps still cause parent re-renders.

**E. R8 disabled — larger DEX = slower class loading, slower cold start**  
Already covered in item 4 above. Enabling R8 reduces startup time noticeably on low-end devices because fewer classes are loaded from disk.

### 6. Is react-native-webrtc included? What is its size?

**Yes, always.** `libjingle_peerconnection_so.so` is present for all 4 ABIs:
- arm64-v8a: **10.9 MB**
- armeabi-v7a: 6.4 MB
- x86: 11.7 MB
- x86_64: 12.2 MB
- **Total across all ABIs: 43.1 MB**

This is the single largest contributor to APK size. The WebRTC stub in `metro.config.js` only activates when `EXPO_PUBLIC_ENABLE_WEBRTC=0`, which is never set in any EAS profile. The native library is linked via Gradle's autolinking regardless of the Metro stub.

### 7. Are there unused large libraries?

**firebase** (`node_modules/firebase/` is 32 MB as an npm package) — but only two sub-modules are actually used (`firebase/app` and `firebase/database`, confirmed in `src/firebase.ts`). Firebase ships as modular JS so tree-shaking should handle this. The DEX contribution is unknown without a class breakdown, but the Firebase SDK itself does add DEX classes.

**No obviously dead native libraries** were found — all large `.so` files map to features that are actively used (WebRTC for calls, Maps for location/taxi, expo-image for image display). However, `libavif_android.so` (4.7 MB total, 900 KB for arm64) comes from `expo-image`'s AVIF decoder; if you don't serve AVIF images from your backend this could be excluded but there is no straightforward config knob for it.

### 8. Is ProGuard/R8 minification enabled?

**No.** `android/app/build.gradle`:
```groovy
def enableMinifyInReleaseBuilds = (findProperty('android.enableMinifyInReleaseBuilds') ?: false).toBoolean()
minifyEnabled enableMinifyInReleaseBuilds
```
`android.enableMinifyInReleaseBuilds` is not set in `gradle.properties`. Defaults to `false`. The ProGuard rules file exists at `android/app/proguard-rules.pro` but only contains keeps for `react-native-reanimated` and `facebook.react.turbomodule` — it is not actively used.

---

## Recommendations (Priority Order)

### 🔴 P0 — ABI split: instant ~92 MB saving, zero risk

Add to `eas.json` in the `preview.android` section:
```json
"android": {
  "buildType": "apk",
  "gradleCommand": ":app:assembleRelease -PreactNativeArchitectures=arm64-v8a"
}
```
This leaves `gradle.properties` unchanged (so local `expo run:android` still builds all ABIs for emulator support) but EAS preview builds will produce an arm64-only APK.

### 🔴 P0 — Enable R8 in `gradle.properties`

```properties
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
```

Add these ProGuard keeps to `android/app/proguard-rules.pro` (required or the app will crash):
```proguard
# Supabase / Ktor
-keep class io.github.jan.supabase.** { *; }
-dontwarn io.ktor.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod <methods>; }
```

### 🟡 P1 — Fix Android chat scroll jumpiness

**Increase `maxToRenderPerBatch`** in `app/chat/[id].tsx`:
```tsx
maxToRenderPerBatch={Platform.OS === 'android' ? 8 : 10}
```

**Reduce `scrollEventThrottle`**:
```tsx
scrollEventThrottle={Platform.OS === 'android' ? 32 : 16}
```

**Fix the last-message visibility at the bottom of the input bar**: the current fallback `ANDROID_INPUT_BAR_FALLBACK = 70` is a fixed constant. If the input bar is taller (e.g. when a reply is being composed), the last message may be hidden behind it. The `onLayout` of the bottomDock (`setBottomDockHeight`) already captures the real height — ensure the `View` spacer (`<View style={{ height: messagesBottomInset }} />`) in `ListFooterComponent` is always using the real measured height rather than the fallback.

### 🟡 P1 — Fix keyboard bounce on Android

Replace the manual `LayoutAnimation` + keyboard listeners with `KeyboardAvoidingView behavior="height"` for Android:
```tsx
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={0}
>
  {/* FlatList + input dock */}
</KeyboardAvoidingView>
```
Combine with `android:windowSoftInputMode="adjustResize"` (already set via `"softwareKeyboardLayoutMode": "resize"` in `app.json`). Remove the four `Keyboard.addListener` calls and `LayoutAnimation.configureNext` calls — let the `KeyboardAvoidingView` handle layout resizing natively. This eliminates the up/down jump.

> ⚠️ **Note:** The user explicitly said NOT to touch keyboard behavior or the chat bar. These keyboard recommendations should only be implemented after explicit approval. The `maxToRenderPerBatch` and `scrollEventThrottle` changes are safe without touching the keyboard.

### 🟢 P2 — Production store builds are already correct

The `production` profile uses `"buildType": "app-bundle"`. AAB + Play Store = per-device APK delivery. Users downloading from the Play Store already get only the correct ABI. The 165 MB issue only affects `preview` APK side-loads.

---

## iOS vs Android Size Comparison

| Factor | iOS (34 MB IPA) | Android (165 MB APK) |
|---|---|---|
| WebRTC native lib | ~8 MB (1 arch, ARM64) | 43 MB (4 archs) |
| Maps native lib | ~3 MB | 20 MB (4 archs) |
| JS engine | JavaScriptCore (OS-provided, free) | Hermes bundled |
| Architectures | 1 (ARM64) | 4 (fat APK) |
| Minification | Yes (Xcode release = always on) | No (disabled in build.gradle) |
| Total native libs | ~12 MB | 124 MB |

iOS is 34 MB because: (1) it only ships ARM64, (2) JavaScriptCore comes from the OS so Hermes doesn't need to be bundled, (3) Xcode's release build always runs bitcode optimization + strip. Android needs each of these applied manually.
