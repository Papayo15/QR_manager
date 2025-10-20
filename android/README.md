# Android Apps - QR Manager

Proyectos Android para **ResidenteApp** y **VigilanciaApp**.

---

## 📱 Apps Incluidas

### 1. ResidenteApp
**Package:** `com.residenteapp`
**Nombre:** ResidenteApp
**Para:** Residentes del condominio

**Funcionalidades:**
- 🏠 Login con número de casa y condominio
- 📱 Generar códigos QR para visitas
- ✍️ Ingresar nombre del visitante y residente (obligatorio)
- 📋 Ver historial de códigos generados
- 📤 Compartir QR por WhatsApp
- ✅ Ver estado: Activo, Usado, Expirado

---

### 2. VigilanciaApp
**Package:** `com.vigilanciaapp`
**Nombre:** VigilanciaApp
**Para:** Personal de vigilancia

**Funcionalidades:**
- 🔍 Validar códigos QR alfanuméricos (6 caracteres)
- 📊 Ver estadísticas del día (generados, validados, negados)
- 👤 Registrar trabajadores con foto de INE
- ☁️ Subir fotos a Google Drive

---

## 📂 Estructura

```
android/
├── ResidenteApp/
│   ├── android/                        ← Proyecto Android nativo
│   │   ├── app/
│   │   │   ├── build.gradle           ← Configuración de app
│   │   │   ├── src/
│   │   │   │   └── main/
│   │   │   │       ├── AndroidManifest.xml
│   │   │   │       └── res/           ← Recursos (iconos, strings)
│   │   │   └── debug.keystore         ← Keystore para debug
│   │   ├── build.gradle               ← Configuración del proyecto
│   │   └── gradle.properties
│   ├── src/                           ← Código TypeScript/React Native
│   ├── package.json
│   └── README.md
│
├── VigilanciaApp/
│   ├── android/                       ← Proyecto Android nativo
│   │   ├── app/
│   │   │   ├── build.gradle
│   │   │   └── src/
│   │   ├── build.gradle
│   │   └── gradle.properties
│   ├── src/                           ← Código TypeScript/React Native
│   └── package.json
│
└── README.md                          ← Este archivo
```

---

## ⚠️ Estado Actual

### ✅ Código Actualizado

Ambas apps tienen el código fuente más reciente con todos los cambios:

**ResidenteApp:**
- ✅ Inputs obligatorios para visitante y residente
- ✅ Mostrar visitante, residente y fecha en QR activo
- ✅ Historial mejorado con todos los datos
- ✅ Fix error al cargar historial (response.data.codes → response.data)
- ✅ KeyboardAvoidingView para evitar que teclado tape campos
- ✅ Backend actualizado para retornar datos completos

**VigilanciaApp:**
- ✅ Cambiar teclado a alfanumérico (acepta letras y números)
- ✅ KeyboardAvoidingView para evitar que teclado tape campo
- ✅ Validación de códigos de 6 caracteres
- ✅ Captura de foto de INE de trabajadores
- ✅ Upload de fotos a Google Drive

### ⏳ APKs Pendientes

**Los APKs deben recompilarse** con los cambios recientes.

**Razón:**
- Estos proyectos son copias frescas con código actualizado
- No incluyen builds anteriores
- Se recompilarán **DESPUÉS** de terminar con iOS

---

## 🔨 Compilar APKs (Cuando esté listo)

### Prerequisitos:

- ✅ Android Studio instalado
- ✅ JDK 17 instalado
- ✅ Android SDK instalado
- ✅ Node.js y npm instalados

### Paso 1: Instalar dependencias

```bash
cd /Users/papayo/Desktop/QR/QR_manager/android/ResidenteApp
npm install --legacy-peer-deps
```

### Paso 2: Compilar APK Debug

```bash
cd android
./gradlew assembleDebug
```

APK generado en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Paso 3: Compilar APK Release (Para distribución)

**Primero, generar keystore:**
```bash
cd android/app
keytool -genkey -v -keystore release.keystore -alias qrmanager -keyalg RSA -keysize 2048 -validity 10000
```

**Configurar gradle.properties:**
```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=qrmanager
MYAPP_RELEASE_STORE_PASSWORD=tu_password
MYAPP_RELEASE_KEY_PASSWORD=tu_password
```

**Compilar:**
```bash
cd android
./gradlew assembleRelease
```

APK firmado generado en:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Paso 4: Instalar APK en dispositivo

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

O arrastrar el archivo .apk al dispositivo Android y abrir.

---

## 📦 Versiones

### Versión Actual: 1.0.0

**ResidenteApp:**
- Version Name: 1.0.0
- Version Code: 1
- Android mínimo: 6.0 (API 23)
- Android target: 34

**VigilanciaApp:**
- Version Name: 1.0.0
- Version Code: 1
- Android mínimo: 6.0 (API 23)
- Android target: 34

---

## 🌐 Backend

Las apps se conectan al backend en Render:

**URL:** https://qr-manager-3z8x.onrender.com
**Health Check:** https://qr-manager-3z8x.onrender.com/health
**Versión:** 2.1

### Endpoints usados:
- `POST /api/register-code` - Generar QR (ResidenteApp)
- `POST /api/validate-qr` - Validar QR (VigilanciaApp)
- `GET /api/get-history` - Historial (ResidenteApp)
- `GET /api/counters` - Estadísticas (VigilanciaApp)
- `POST /api/register-worker` - Registrar trabajador (VigilanciaApp)

---

## 📝 Cambios Recientes Incluidos

### v1.0.0 (Pendiente compilar)

**ResidenteApp:**
- ✅ Agregar campos obligatorios: visitante y residente
- ✅ Mostrar visitante, residente y fecha en QR activo
- ✅ Historial mejorado con todos los datos
- ✅ Fix error al cargar historial
- ✅ KeyboardAvoidingView para mejor UX en teclados
- ✅ Conectado a backend Render actualizado

**VigilanciaApp:**
- ✅ Teclado alfanumérico (permite letras y números)
- ✅ KeyboardAvoidingView para mejor UX
- ✅ Validación de códigos de 6 caracteres
- ✅ Captura y upload de fotos de INE
- ✅ Estadísticas del día
- ✅ Conectado a backend Render actualizado

---

## 🔧 Solución de Problemas

### Error: "Gradle build failed"

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Error: "SDK location not found"

Crear archivo `local.properties` en `/android/`:
```properties
sdk.dir=/Users/TU_USUARIO/Library/Android/sdk
```

### Error: "Unable to load script"

```bash
npm start --reset-cache
```

### Error: "Execution failed for task ':app:mergeDebugResources'"

```bash
cd android
./gradlew clean
rm -rf .gradle
./gradlew assembleDebug
```

---

## 📱 Distribución

### Método Actual (APK):
1. Compilar APK release firmado
2. Distribuir archivo .apk
3. Usuarios instalan manualmente (permitir "Fuentes desconocidas")

### Método Recomendado (Google Play Store):
1. Crear cuenta de desarrollador ($25 pago único)
2. Compilar App Bundle (.aab)
3. Subir a Google Play Console
4. Distribución via Play Store
5. Actualizaciones automáticas

### Para Google Play:

**Compilar App Bundle:**
```bash
cd android
./gradlew bundleRelease
```

Bundle generado en:
```
android/app/build/outputs/bundle/release/app-release.aab
```

**Subir a Google Play Console:**
1. https://play.google.com/console
2. Crear nueva app
3. Upload .aab
4. Completar listado de la tienda
5. Enviar para revisión

---

## 🎯 Próximos Pasos

**Cuando termines con iOS:**

1. **Compilar APKs debug** para probar
2. **Generar keystore** para releases
3. **Compilar APKs release** firmados
4. **Probar** en dispositivos Android reales
5. **Distribuir** a residentes via APK o Play Store
6. **(Opcional)** Publicar en Google Play Store

---

## 🛠 Comandos Útiles

### Limpiar build:
```bash
cd android
./gradlew clean
```

### Ver dispositivos conectados:
```bash
adb devices
```

### Ver logs en tiempo real:
```bash
adb logcat *:E
```

### Desinstalar app:
```bash
adb uninstall com.residenteapp
adb uninstall com.vigilanciaapp
```

### Reinstalar dependencias npm:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## 📚 Documentación

### React Native:
- https://reactnative.dev/docs/getting-started

### Android Studio:
- https://developer.android.com/studio

### Gradle:
- https://gradle.org/guides/

---

## ⚙️ Configuración

### Permisos Android (AndroidManifest.xml):

**ResidenteApp:**
- `INTERNET` - Conexión al backend
- `READ_EXTERNAL_STORAGE` - Leer galería
- `WRITE_EXTERNAL_STORAGE` - Guardar QR
- `ACCESS_FINE_LOCATION` - Verificar ubicación

**VigilanciaApp:**
- `INTERNET` - Conexión al backend
- `CAMERA` - Capturar foto INE
- `READ_EXTERNAL_STORAGE` - Leer galería
- `WRITE_EXTERNAL_STORAGE` - Guardar fotos
- `ACCESS_FINE_LOCATION` - Verificar ubicación

---

## 📦 Dependencias

### npm (JavaScript):
- React 18.3.1
- React Native 0.76.5
- React Navigation 7.x
- TypeScript

### Nativas Android:
- react-native-svg (QR codes)
- react-native-share (Compartir)
- react-native-async-storage (Almacenamiento)
- react-native-vision-camera (Cámara para VigilanciaApp)
- react-native-image-picker (Seleccionar fotos)

---

## 💡 Notas Importantes

### ⚠️ NO modificar estos archivos directamente

Los archivos en `/android/` son **copias** del código actualizado.
Los cambios se hacen en `/ios/` o `/backend/apps/` y luego se copian aquí.

### ✅ SIEMPRE probar después de cambios

1. Limpiar build: `./gradlew clean`
2. Recompilar: `./gradlew assembleDebug`
3. Probar en emulador o dispositivo real
4. Verificar conexión al backend

### 📱 Probar en dispositivos reales

Los emuladores no siempre reflejan el comportamiento real.
Siempre prueba en dispositivos Android físicos antes de distribuir.

---

## 🔒 Seguridad

### Keystore para releases:

⚠️ **NUNCA** subir keystores a Git
⚠️ **SIEMPRE** hacer backup del keystore
⚠️ **GUARDAR** passwords en lugar seguro (password manager)

Si pierdes el keystore, no podrás actualizar la app en Play Store.

### Ubicación del keystore:
```
/android/ResidenteApp/android/app/release.keystore
/android/VigilanciaApp/android/app/release.keystore
```

**Backup recomendado:**
- iCloud Drive (cifrado)
- Google Drive (cifrado)
- Password manager (1Password, LastPass)
- Disco externo

---

## 📞 Soporte

**Problemas compilando:**
- Verifica versión de JDK: `java -version` (debe ser 17)
- Verifica Android SDK instalado
- Limpia build y reintenta

**Problemas con la app:**
- Verifica backend: https://qr-manager-3z8x.onrender.com/health
- Revisa logs: `adb logcat`
- Reinstala la app

**Problemas con dependencias:**
- Elimina `node_modules` y `package-lock.json`
- Reinstala con `--legacy-peer-deps`

---

**Versión actual:** 1.0.0 (pendiente compilar)
**Backend URL:** https://qr-manager-3z8x.onrender.com
**Última actualización:** Octubre 2025

---

*Preparado con Claude Code*
