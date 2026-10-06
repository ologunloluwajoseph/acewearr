# AceWears — Android App Build Guide (Softonic)

## Overview
AceWears is a complete fashion e-commerce platform built with Next.js 16, packaged as a **native Android APK** using Capacitor. The app loads from your live website and wraps it in a native Android shell. The output `.apk` file is ready to upload to **Softonic**.

## Quick Start

### 1. Install Android Studio
Download from https://developer.android.com/studio (includes Android SDK + JDK 17).

### 2. Create a Keystore (one-time)
```bash
keytool -genkey -v -keystore acewears.keystore \
  -alias acewears -keyalg RSA -keysize 2048 -validity 10000
```
Save the password securely — you'll need it for every update.

### 3. Configure Signing
Edit `android/app/build.gradle` — uncomment the `signingConfigs` block:
```gradle
signingConfigs {
    release {
        storeFile file('acewears.keystore')
        storePassword 'YOUR_KEYSTORE_PASSWORD'
        keyAlias 'acewears'
        keyPassword 'YOUR_KEY_PASSWORD'
    }
}
```
Also uncomment `signingConfig signingConfigs.release` in the `release` build type.

Place the keystore file at `android/app/acewears.keystore`.

### 4. Update Server URL
Edit `capacitor.config.ts` — change `server.url` to your production domain:
```typescript
server: {
    url: 'https://your-domain.com',
    cleartext: true,
},
```

### 5. Build the APK
```bash
chmod +x scripts/build-android.sh
./scripts/build-android.sh
```

Output:
- `android/app/build/outputs/apk/release/app-release.apk` → **Upload to Softonic**
- `android/app/build/outputs/apk/debug/app-debug.apk` → Test on device

### 6. Upload to Softonic
1. Go to https://en.softonic.com/developers
2. Sign up as a developer
3. Click "Submit your software"
4. Upload the `.apk` file
5. Fill in the app details (see `download/SOFTONIC_LISTING.md`)
6. Add screenshots (see list in the listing)
7. Submit for review

### 7. Manual Signing (if build.gradle signing not configured)
If you built without signing in build.gradle:
```bash
# Sign the APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore acewears.keystore \
  android/app/build/outputs/apk/release/app-release-unsigned.apk acewears

# Align it (required by Android)
zipalign -v 4 \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  android/app/build/outputs/apk/release/app-release.apk
```

## How Updates Work

### Website updates (automatic, no republishing)
The app loads from your live URL. When you update the website:
1. App checks `/api/app/update-check` every 30 minutes
2. If new version available → shows "Update Available" banner
3. User taps "Update Now" → cache clears → app reloads with latest
4. **No need to re-upload APK to Softonic**

### APK updates (manual, republish)
Only needed when you change:
- Android permissions
- App icon
- Native plugins
- Version number

To push an APK update to Softonic:
1. Bump `versionCode` and `versionName` in `android/app/build.gradle`
2. Rebuild: `./scripts/build-android.sh`
3. Upload the new `.apk` to Softonic
4. Softonic reviews and publishes the update

## Project Structure
```
android/                       ← Native Android project
  app/
    build.gradle               ← App config (version, signing, AAB)
    src/main/
      AndroidManifest.xml      ← Permissions, deep links
      java/.../MainActivity    ← Capacitor entry point
      res/
        values/strings.xml     ← App name = "AceWears"
        xml/network_security_config.xml
        mipmap/                 ← App icons (replace with your own)
  build.gradle                 ← Project-level config
  gradlew                      ← Gradle wrapper
capacitor.config.ts            ← Capacitor config (appId, server URL, plugins)
scripts/build-android.sh      ← One-command build script
download/SOFTONIC_LISTING.md   ← Softonic listing template
```

## App Details
| Field | Value |
|---|---|
| Package ID | `com.acewears.app` |
| App name | AceWears |
| Version | 1.0.0 |
| Min Android | 7.0 (API 24) |
| Target Android | 14 (API 34) |
| File type | APK |
| App size | ~5MB (native shell) |

## Permissions
| Permission | Why |
|---|---|
| INTERNET | Load products, process payments |
| ACCESS_NETWORK_STATE | Check offline status |
| CAMERA | AI Try-On body photo upload |
| READ/WRITE_EXTERNAL_STORAGE | Save try-on images |
| VIBRATE | Notification feedback |
| POST_NOTIFICATIONS | Order updates, restock alerts |

## Alternative: Fully Offline App
If you want the app to work fully offline (no server needed):

1. Edit `next.config.ts`:
```typescript
const nextConfig = {
  output: 'export',
};
```

2. Build: `bun run build`
3. Copy: `npx cap copy android`
4. Update `capacitor.config.ts` — remove `server.url`, add `androidScheme: 'https'`
5. Build APK: `cd android && ./gradlew :app:assembleRelease`

App will be ~50MB but work completely offline.
