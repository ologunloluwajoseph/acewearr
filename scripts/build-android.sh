#!/bin/bash
# ============================================================================
#  AceWears — Android APK Build Script (for Softonic)
#  Produces a signed .apk for Softonic upload.
#
#  PREREQUISITES:
#  1. Android Studio installed (or Android SDK + JDK 17)
#  2. Create a keystore (one-time):
#     keytool -genkey -v -keystore acewears.keystore \
#       -alias acewears -keyalg RSA -keysize 2048 -validity 10000 \
#       -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD
#  3. Place acewears.keystore in android/app/
#  4. Edit android/app/build.gradle → uncomment signingConfig lines + add passwords
#  5. Update capacitor.config.ts → server.url to your production domain
#
#  BUILD:
#     chmod +x scripts/build-android.sh
#     ./scripts/build-android.sh
#
#  OUTPUT:
#     android/app/build/outputs/apk/release/app-release.apk
#     → Upload this .apk file to Softonic
# ============================================================================

set -e

echo "========================================"
echo "  AceWears Android APK Build (Softonic)"
echo "========================================"

cd /home/z/my-project

# Step 1: Sync web assets
echo "[1/5] Syncing Capacitor..."
npx cap sync android 2>&1 || echo "Warning: sync skipped (using remote URL)"

cd android

# Step 2: Clean previous builds
echo "[2/5] Cleaning previous builds..."
./gradlew clean 2>&1 | tail -3

# Step 3: Build release APK (not AAB — Softonic distributes APKs)
echo "[3/5] Building release APK..."
./gradlew :app:assembleRelease 2>&1 | tail -5

# Step 4: Check output
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_PATH" ]; then
    # If unsigned build exists, try that path
    APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
fi

if [ -f "$APK_PATH" ]; then
    echo "[4/5] APK generated successfully!"
    ls -lh "$APK_PATH"
    echo ""
    echo "File: $APK_PATH"

    # If unsigned, sign it
    if [[ "$APK_PATH" == *"unsigned"* ]]; then
        echo ""
        echo "[4b/5] APK is unsigned. Sign it with:"
        echo "  jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256"
        echo "    -keystore acewears.keystore $APK_PATH acewears"
        echo ""
        echo "  Then align:"
        echo "  zipalign -v 4 $APK_PATH app-release-signed.apk"
        echo ""
        echo "  For automatic signing, uncomment signingConfig in build.gradle"
    fi
else
    echo "[4/5] ERROR: APK not found"
    echo "Check build output above for errors."
    exit 1
fi

# Step 5: Also build debug APK for quick testing
echo "[5/5] Building debug APK for testing..."
./gradlew :app:assembleDebug 2>&1 | tail -3
DEBUG_APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$DEBUG_APK" ]; then
    echo "Debug APK ready: $DEBUG_APK"
    ls -lh "$DEBUG_APK"
fi

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "Release APK: $APK_PATH"
echo "Debug APK:   $DEBUG_APK"
echo ""
echo "SOFTONIC UPLOAD:"
echo "  1. Go to https://en.softonic.com/developers"
echo "  2. Sign up as a developer"
echo "  3. Upload the .apk file"
echo "  4. Fill in app details (see download/SOFTONIC_LISTING.md)"
echo "  5. Submit for review"
echo ""
echo "App name:      AceWears — Threads Reimagined"
echo "Package:       com.acewears.app"
echo "Version:       1.0.0"
echo "Category:      Shopping"
