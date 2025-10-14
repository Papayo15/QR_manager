#!/bin/bash

echo "🏗️  Generando APK de VigilanciaApp..."
cd /workspaces/QR_manager/apps/VigilanciaApp/android
./gradlew clean assembleRelease
cp app/build/outputs/apk/release/app-release.apk /workspaces/QR_manager/VigilanciaApp-Final.apk
echo "✅ VigilanciaApp-Final.apk generado"

echo ""
echo "🏗️  Generando APK de ResidenteApp..."
cd /workspaces/QR_manager/apps/ResidenteApp/android
./gradlew clean assembleRelease
cp app/build/outputs/apk/release/app-release.apk /workspaces/QR_manager/ResidenteApp-Final.apk
echo "✅ ResidenteApp-Final.apk generado"

echo ""
echo "🎉 ¡Ambos APKs generados exitosamente!"
ls -lh /workspaces/QR_manager/*.apk
