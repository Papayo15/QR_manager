# iOS Apps - QR Manager

Proyectos iOS para **ResidenteApp** y **VigilanciaApp**.

---

## 📱 Apps Incluidas

### 1. ResidenteApp
**Bundle ID:** `com.qrmanager.residentes`
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
**Bundle ID:** `com.qrmanager.vigilancia`
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
ios/
├── ResidenteApp/
│   ├── ios/
│   │   ├── ResidenteApp.xcworkspace    ← Abrir ESTE en Xcode
│   │   ├── ResidenteApp.xcodeproj
│   │   ├── Pods/                       ← Dependencias instaladas
│   │   ├── Podfile
│   │   └── ResidenteApp/
│   │       ├── Info.plist              ← Permisos configurados
│   │       └── Images.xcassets
│   ├── src/                            ← Código TypeScript/React Native
│   ├── node_modules/                   ← Dependencias npm instaladas
│   └── package.json
│
├── VigilanciaApp/
│   ├── ios/
│   │   ├── VigilanciaApp.xcworkspace   ← Abrir ESTE en Xcode
│   │   ├── VigilanciaApp.xcodeproj
│   │   ├── Pods/                       ← Dependencias instaladas
│   │   ├── Podfile
│   │   └── VigilanciaApp/
│   │       ├── Info.plist              ← Permisos configurados
│   │       └── Images.xcassets
│   ├── src/                            ← Código TypeScript/React Native
│   ├── node_modules/                   ← Dependencias npm instaladas
│   └── package.json
│
└── ipa/
    ├── GUIA_IOS.md                     ← 📖 GUÍA COMPLETA PASO A PASO
    ├── README.md                       ← Tracking de IPAs generadas
    ├── ResidenteApp/                   ← IPAs de ResidenteApp aquí
    └── VigilanciaApp/                  ← IPAs de VigilanciaApp aquí
```

---

## 🚀 Inicio Rápido

### 1. Prerequisitos

- ✅ macOS con Xcode 14.0+ instalado
- ✅ CocoaPods instalados (ya usado para preparar proyectos)
- ✅ Node.js y npm instalados
- ✅ Cuenta Apple Developer: qrcasasok@gmail.com

### 2. Abrir en Xcode

⚠️ **IMPORTANTE:** Abre el archivo `.xcworkspace`, NO el `.xcodeproj`

**ResidenteApp:**
```bash
open /Users/papayo/Desktop/QR/QR_manager/ios/ResidenteApp/ios/ResidenteApp.xcworkspace
```

**VigilanciaApp:**
```bash
open /Users/papayo/Desktop/QR/QR_manager/ios/VigilanciaApp/ios/VigilanciaApp.xcworkspace
```

### 3. Configurar Code Signing

En Xcode:
1. Seleccionar proyecto (carpeta azul en navegador)
2. Seleccionar target → pestaña "Signing & Capabilities"
3. Marcar ✅ "Automatically manage signing"
4. Team: **qrcasasok@gmail.com (Personal Team)**

### 4. Generar IPAs

👉 **Lee la guía completa:** [`ipa/GUIA_IOS.md`](./ipa/GUIA_IOS.md)

**Resumen rápido:**
1. Xcode → Product → Archive
2. Organizer → Distribute App → Ad Hoc
3. Guardar IPA en `/ipa/ResidenteApp/` o `/ipa/VigilanciaApp/`

---

## ⚙️ Configuración

### Bundle Identifiers (Ya configurados):
- **ResidenteApp:** `com.qrmanager.residentes`
- **VigilanciaApp:** `com.qrmanager.vigilancia`

### Permisos iOS (Ya configurados en Info.plist):

**ResidenteApp:**
- `NSPhotoLibraryUsageDescription` - Compartir QR
- `NSPhotoLibraryAddUsageDescription` - Guardar QR
- `NSLocationWhenInUseUsageDescription` - Verificar ubicación

**VigilanciaApp:**
- `NSCameraUsageDescription` - Capturar foto INE
- `NSPhotoLibraryUsageDescription` - Seleccionar fotos
- `NSPhotoLibraryAddUsageDescription` - Guardar fotos
- `NSLocationWhenInUseUsageDescription` - Verificar ubicación

### Versiones:
- **Versión actual:** 1.0.0
- **Build:** 1
- **iOS mínimo soportado:** 13.4+
- **iOS recomendado:** 16.0+
- **Xcode requerido:** 14.0+

---

## 📦 Dependencias

### CocoaPods (Nativas iOS):

**ResidenteApp (71 pods):**
- React Native 0.76.5
- react-native-svg (QR codes)
- react-native-share (Compartir por WhatsApp)
- react-native-async-storage (Almacenamiento local)
- react-native-safe-area-context
- react-native-screens
- Hermes engine

**VigilanciaApp (72 pods):**
- React Native 0.76.5
- react-native-svg (QR codes)
- react-native-vision-camera (Captura de fotos)
- react-native-image-picker (Seleccionar fotos)
- react-native-async-storage
- react-native-safe-area-context
- react-native-screens
- Hermes engine

### npm (JavaScript):
- React 18.3.1
- React Native 0.76.5
- React Navigation 7.x
- TypeScript

---

## 🔨 Comandos Útiles

### Reinstalar pods:
```bash
cd ios/ResidenteApp/ios
rm -rf Pods Podfile.lock
export LANG=en_US.UTF-8
pod install
```

### Limpiar build en Xcode:
```
Product → Clean Build Folder
o
Shift + Cmd + K
```

### Ver logs de Metro bundler:
```bash
cd ios/ResidenteApp
npm start
```

### Limpiar caché de npm:
```bash
cd ios/ResidenteApp
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## 🧪 Testing

### En Simulador:
1. Xcode → Seleccionar simulador (ej: iPhone 15 Pro)
2. Click ▶️ Play o Cmd + R
3. Probar funcionalidades básicas

### En iPhone Real:
1. Conectar iPhone via cable
2. Xcode → Seleccionar tu iPhone
3. Click ▶️ Play o Cmd + R
4. Confiar en desarrollador: Settings → General → VPN & Device Management

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

## 📱 Distribución

### Método Actual (Cuenta Gratuita):
- ⚠️ Instalación via cable con Xcode
- ⚠️ Certificados expiran cada 7 días
- ⚠️ Apps instaladas expiran cada 7 días
- ⚠️ Máximo 3 apps activas

### Método Recomendado (Cuenta de Pago - $99/año):
- ✅ TestFlight para distribución inalámbrica
- ✅ Hasta 10,000 beta testers
- ✅ Certificados válidos 1 año
- ✅ Apps no expiran
- ✅ Actualizaciones automáticas

---

## 📝 Cambios Recientes

### v1.0.0 (Actual)

**ResidenteApp:**
- ✅ Agregar campos obligatorios: visitante y residente
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

---

## 🔧 Solución de Problemas

### Error: "Pod install failed"
```bash
cd ios/ResidenteApp/ios
rm -rf Pods Podfile.lock
export LANG=en_US.UTF-8
pod install
```

### Error: "Signing requires a development team"
- Xcode → Proyecto → Signing & Capabilities
- Marcar "Automatically manage signing"
- Seleccionar Team: qrcasasok@gmail.com

### Error: "App installation failed"
- Eliminar app del iPhone
- Xcode → Product → Clean Build Folder
- Volver a compilar

### Error: "Failed to create provisioning profile"
- Normal con cuenta gratuita
- Registra UDID del iPhone en developer.apple.com

---

## 📚 Documentación

### Guía Principal:
- **[GUIA_IOS.md](./ipa/GUIA_IOS.md)** - Guía completa paso a paso (15+ secciones)

### Temas cubiertos:
1. Requisitos previos
2. Configurar Apple Developer
3. Abrir proyectos en Xcode
4. Configurar Code Signing
5. Probar en simulador
6. Probar en iPhone real
7. Generar Archive
8. Exportar IPA
9. Instalar en dispositivos
10. Preparar TestFlight
11. Solución de problemas
12. Cuenta gratuita vs de pago
13. Actualizar apps

---

## 🎯 Próximos Pasos

1. ✅ **Ahora:** Abre proyectos en Xcode y genera IPAs
2. ⏳ **Pronto:** Actualiza a cuenta de pago ($99/año)
3. 🚀 **Después:** Distribuye a residentes via TestFlight
4. 📱 **Opcional:** Publica en App Store

---

## 👨‍💻 Desarrollo

### Modificar código:
1. Edita archivos en `src/`
2. Metro bundler recarga automáticamente
3. Para cambios nativos, recompila en Xcode

### Agregar dependencias nativas:
```bash
cd ios/ResidenteApp
npm install nombre-libreria
cd ios
pod install
```

### Actualizar React Native:
```bash
npx react-native upgrade
```

---

## 📞 Soporte

**Problemas con Xcode:**
- Consulta GUIA_IOS.md sección "Solución de Problemas"

**Problemas con el backend:**
- Verifica: https://qr-manager-3z8x.onrender.com/health
- Revisa logs en dashboard.render.com

**Problemas con código:**
- Revisa logs de Metro bundler
- Usa React Native Debugger

---

**Apple Developer Account:** qrcasasok@gmail.com
**Backend URL:** https://qr-manager-3z8x.onrender.com
**Versión actual:** 1.0.0

---

*Última actualización: Octubre 2025*
*Preparado con Claude Code*
