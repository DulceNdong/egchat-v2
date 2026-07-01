# EGCHAT Native Builds

## Android APK

From Windows:

```bat
cd egchat-mobile
build-android-apk.bat
```

Output:

```text
egchat-mobile\android\app\build\outputs\apk\release\app-release.apk
```

Cloud APK alternative:

```bash
cd egchat-mobile
eas build --profile preview --platform android
```

## iOS for Xcode on Mac

Copy/open this `egchat-mobile` folder on the Mac, then run:

```bash
cd egchat-mobile
chmod +x prepare-xcode-mac.sh
./prepare-xcode-mac.sh
```

The script installs dependencies, generates the native `ios/` project with Expo prebuild, runs `pod install` when CocoaPods is available, and opens the Xcode workspace.

Requirements on Mac:

```bash
brew install node
sudo gem install cocoapods
```

Use Xcode to select your Apple Team, then build/run on iPhone or archive for TestFlight/App Store.
