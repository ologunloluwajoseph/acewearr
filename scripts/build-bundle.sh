#!/usr/bin/env bash
# Build a comprehensive downloadable bundle for AceWears.
# Produces:
#   - download/acewears-source.zip        (source code, refreshed)
#   - download/acewears-bundle.zip         (APK + source + docs combined)
set -e

PROJECT_DIR="/home/z/my-project"
DOWNLOAD_DIR="${PROJECT_DIR}/download"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

cd "${PROJECT_DIR}"

echo "==> [1/4] Refreshing source zip (acewears-source.zip)..."
rm -f "${DOWNLOAD_DIR}/acewears-source.zip"
zip -r -q "${DOWNLOAD_DIR}/acewears-source.zip" \
  src android prisma public scripts tests examples mini-services db \
  package.json package-lock.json bun.lock \
  tsconfig.json next.config.ts next-env.d.ts \
  capacitor.config.ts tailwind.config.ts postcss.config.mjs \
  components.json eslint.config.mjs Caddyfile .gitignore \
  vercel.json .env.example VERCEL_DEPLOYMENT_GUIDE.md \
  -x 'node_modules/*' -x '.next/*' -x '.git/*' -x 'tool-results/*' \
     'dev.log' '*.apk' 'acewears-source.zip' 'acewears-bundle.zip' \
     '*.log' 'download/*' 'skills/*' 'upload/*' '.zscripts/*'
echo "    -> $(ls -lh "${DOWNLOAD_DIR}/acewears-source.zip" | awk '{print $5}')"

echo "==> [2/4] Staging bundle contents..."
BUNDLE_DIR="${TMP_DIR}/acewears-bundle"
mkdir -p "${BUNDLE_DIR}"
cp "${DOWNLOAD_DIR}/acewears-v1.0.0.apk"        "${BUNDLE_DIR}/"
cp "${DOWNLOAD_DIR}/acewears-source.zip"        "${BUNDLE_DIR}/"
cp "${DOWNLOAD_DIR}/ANDROID_BUILD_GUIDE.md"     "${BUNDLE_DIR}/"
cp "${DOWNLOAD_DIR}/PLAY_STORE_LISTING.md"      "${BUNDLE_DIR}/"
cp "${DOWNLOAD_DIR}/SOFTONIC_LISTING.md"        "${BUNDLE_DIR}/"
cp "${DOWNLOAD_DIR}/DELIVERABLES.md"            "${BUNDLE_DIR}/"
cp "${DOWNLOAD_DIR}/README.md"                  "${BUNDLE_DIR}/"

cat > "${BUNDLE_DIR}/QUICKSTART.md" <<'EOF'
# AceWears v1.0.0 — Downloadable Bundle

Thanks for downloading! Here's what's inside this ZIP:

## What's in this bundle

| File | What it is | What to do with it |
|------|------------|--------------------|
| `acewears-v1.0.0.apk` | Pre-built Android installer | Sideload onto any Android 8+ device to test the app |
| `acewears-source.zip`  | Full Next.js + Capacitor source | Unzip & follow `ANDROID_BUILD_GUIDE.md` to rebuild from source |
| `ANDROID_BUILD_GUIDE.md` | Step-by-step APK build instructions | Read this if you want to build the APK yourself |
| `PLAY_STORE_LISTING.md`  | Google Play store metadata | Use when submitting to the Play Console |
| `SOFTONIC_LISTING.md`    | Softonic / third-party listing copy | Use when publishing to software catalogs |
| `DELIVERABLES.md`        | Full inventory of project deliverables | Reference for what's been built |

## Fast path — install the APK

1. Transfer `acewears-v1.0.0.apk` to your Android phone.
2. Open it with your file manager.
3. Allow "Install unknown apps" if prompted.
4. Tap **Install**. Done.

## Slow path — build from source

1. Unzip `acewears-source.zip`.
2. Open `ANDROID_BUILD_GUIDE.md` and follow the steps.
3. You'll need Node 20+, JDK 17, and Android SDK (command-line tools OK).
EOF

echo "==> [3/4] Building bundle zip (acewears-bundle.zip)..."
rm -f "${DOWNLOAD_DIR}/acewears-bundle.zip"
cd "${TMP_DIR}"
zip -r -q "${DOWNLOAD_DIR}/acewears-bundle.zip" acewears-bundle
echo "    -> $(ls -lh "${DOWNLOAD_DIR}/acewears-bundle.zip" | awk '{print $5}')"

echo "==> [4/4] Done. Final deliverables:"
ls -lh "${DOWNLOAD_DIR}/acewears-v1.0.0.apk" \
       "${DOWNLOAD_DIR}/acewears-source.zip" \
       "${DOWNLOAD_DIR}/acewears-bundle.zip" \
       "${DOWNLOAD_DIR}/ANDROID_BUILD_GUIDE.md"
