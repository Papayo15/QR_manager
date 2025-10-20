# Guía Completa: Generar IPAs de iOS para QR Manager

**Versión:** 1.0
**Fecha:** Octubre 2025
**Apps:** ResidenteApp y VigilanciaApp
**Autor:** Preparado con Claude Code

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Apps Incluidas](#3-apps-incluidas)
4. [Configurar Apple Developer Account](#4-configurar-apple-developer-account)
5. [Abrir Proyectos en Xcode](#5-abrir-proyectos-en-xcode)
6. [Configurar Code Signing](#6-configurar-code-signing)
7. [Probar en Simulador iOS](#7-probar-en-simulador-ios)
8. [Probar en iPhone Real](#8-probar-en-iphone-real)
9. [Generar Archive](#9-generar-archive)
10. [Exportar IPA Ad Hoc](#10-exportar-ipa-ad-hoc)
11. [Instalar IPA en Dispositivos](#11-instalar-ipa-en-dispositivos)
12. [Preparar para TestFlight](#12-preparar-para-testflight)
13. [Solución de Problemas](#13-solución-de-problemas)
14. [Cuenta Gratuita vs De Pago](#14-cuenta-gratuita-vs-de-pago)
15. [Actualizar Apps Después de Cambios](#15-actualizar-apps-después-de-cambios)

---

## 1. Introducción

Esta guía te llevará paso a paso por el proceso completo de generar archivos IPA (iOS App Store Package) para las apps **ResidenteApp** y **VigilanciaApp** del proyecto QR Manager.

### ¿Qué es un IPA?

Un archivo `.ipa` es el paquete de instalación de una app iOS. Es el equivalente de un `.apk` en Android. Con un IPA puedes:

- Instalar la app en iPhones reales vía cable
- Distribuir la app a beta testers via TestFlight
- Publicar la app en el App Store

### Flujo General

```
Código TypeScript → Xcode → Archive → IPA → Instalación/Distribución
```

---

## 2. Requisitos Previos

### En tu Mac:

- ✅ **macOS** (Big Sur 11.0 o superior)
- ✅ **Xcode 14.0+** instalado (ya lo tienes)
- ✅ **CocoaPods** instalado (ya usado para preparar proyectos)
- ✅ **Node.js** instalado
- ✅ Cable Lightning o USB-C para conectar iPhone

### Cuentas y Accesos:

- ✅ **Apple ID:** qrcasasok@gmail.com (ya creada)
- ✅ **Apple Developer Account** configurada
- ⏳ **Cuenta de Pago** ($99/año - opcional para empezar)

### Verificar versión de Xcode:

```bash
xcodebuild -version
```

Debe mostrar: `Xcode 14.0` o superior.

---

## 3. Apps Incluidas

### 3.1 ResidenteApp

**Bundle ID:** `com.qrmanager.residentes`
**Nombre en iPhone:** ResidenteApp
**Para:** Residentes del condominio

**Funcionalidades:**
- Login con número de casa y condominio
- Generar códigos QR para visitas
- Ingresar nombre del visitante y residente (obligatorio)
- Ver historial de códigos generados
- Compartir QR por WhatsApp
- Ver estado: Activo, Usado, Expirado

**Permisos iOS necesarios:**
- `NSPhotoLibraryUsageDescription` - Para compartir QR
- `NSPhotoLibraryAddUsageDescription` - Para guardar QR en galería
- `NSLocationWhenInUseUsageDescription` - Verificar ubicación

---

### 3.2 VigilanciaApp

**Bundle ID:** `com.qrmanager.vigilancia`
**Nombre en iPhone:** VigilanciaApp
**Para:** Personal de vigilancia

**Funcionalidades:**
- Validar códigos QR alfanuméricos (6 caracteres)
- Ver estadísticas del día (generados, validados, negados)
- Registrar trabajadores con foto de INE
- Subir fotos a Google Drive

**Permisos iOS necesarios:**
- `NSCameraUsageDescription` - Capturar fotos de INE
- `NSPhotoLibraryUsageDescription` - Seleccionar fotos
- `NSPhotoLibraryAddUsageDescription` - Guardar fotos
- `NSLocationWhenInUseUsageDescription` - Verificar ubicación

---

## 4. Configurar Apple Developer Account

### 4.1 Crear cuenta gratuita (si no la tienes)

1. Ve a: https://developer.apple.com
2. Click en **"Account"** (esquina superior derecha)
3. Click en **"Sign in with your Apple ID"**
4. Ingresa: **qrcasasok@gmail.com** y tu contraseña
5. Acepta los **Apple Developer Agreement**
6. Completa tu perfil de desarrollador

### 4.2 Verificar que tu cuenta está activa

1. En developer.apple.com, ve a **"Certificates, Identifiers & Profiles"**
2. Deberías ver tu información de cuenta
3. Si ves un mensaje de "Join the Apple Developer Program", aún puedes usar la cuenta gratuita para pruebas

---

## 5. Abrir Proyectos en Xcode

### ⚠️ IMPORTANTE: Abre el .xcworkspace, NO el .xcodeproj

CocoaPods crea un archivo `.xcworkspace` que contiene el proyecto y sus dependencias. **Siempre** abre este archivo.

### 5.1 Abrir ResidenteApp

1. Abre **Finder**
2. Navega a:
   ```
   /Users/papayo/Desktop/QR/QR_manager/ios/ResidenteApp/ios/
   ```
3. Busca el archivo: **`ResidenteApp.xcworkspace`** (icono blanco con fondo azul)
4. **Doble click** en `ResidenteApp.xcworkspace`
5. Xcode se abrirá y cargará el proyecto (tarda ~30 segundos)

### 5.2 Abrir VigilanciaApp

Mismo proceso:
1. Navega a:
   ```
   /Users/papayo/Desktop/QR/QR_manager/ios/VigilanciaApp/ios/
   ```
2. Doble click en **`VigilanciaApp.xcworkspace`**

### 5.3 Estructura del proyecto en Xcode

Una vez abierto, verás en el navegador lateral izquierdo:

```
ResidenteApp (carpeta azul)
├── ResidenteApp/
│   ├── AppDelegate.h
│   ├── AppDelegate.mm
│   ├── Info.plist          ← Permisos configurados aquí
│   ├── Images.xcassets     ← Iconos de la app
│   └── LaunchScreen.storyboard
├── Pods/                   ← Dependencias instaladas
└── Products/
    └── ResidenteApp.app
```

---

## 6. Configurar Code Signing

El "Code Signing" permite a Apple verificar que tú eres el desarrollador de la app.

### 6.1 Seleccionar el proyecto

1. En Xcode, en el navegador lateral izquierdo, click en **ResidenteApp** (carpeta azul arriba de todo)
2. Verás la configuración del proyecto en el panel central

### 6.2 Seleccionar el target

1. En la columna central, bajo "TARGETS", click en **ResidenteApp**
2. Ve a la pestaña **"Signing & Capabilities"**

### 6.3 Configurar Automatically Manage Signing

1. Marca la casilla ✅ **"Automatically manage signing"**
2. En **"Team"**, selecciona tu cuenta: **qrcasasok@gmail.com (Personal Team)**
3. Verifica que **"Bundle Identifier"** sea: `com.qrmanager.residentes`

### 6.4 Xcode generará certificados automáticamente

Si es la primera vez, Xcode te pedirá:
- Ingresar tu contraseña de macOS (para crear certificados)
- Puede mostrar avisos como "Failed to create provisioning profile" - esto es normal con cuenta gratuita

**Con cuenta gratuita:**
- ⚠️ Los certificados expiran en 7 días
- ⚠️ Solo puedes tener 3 apps activas simultáneamente
- ⚠️ La app instalada expirará después de 7 días

### 6.5 Repetir para VigilanciaApp

1. Abre `VigilanciaApp.xcworkspace`
2. Selecciona proyecto → target → Signing & Capabilities
3. Automatically manage signing
4. Team: qrcasasok@gmail.com
5. Bundle ID: `com.qrmanager.vigilancia`

---

## 7. Probar en Simulador iOS

Antes de generar el IPA, es bueno probar que la app compila y funciona.

### 7.1 Seleccionar un simulador

1. En la barra superior de Xcode, al lado del botón ▶️ Play
2. Click en el nombre del dispositivo (ej: "iPhone 15 Pro")
3. Selecciona: **iPhone 15 Pro** (o cualquier iOS 16+)

### 7.2 Ejecutar la app

1. Click en el botón ▶️ **Play** (o presiona **Cmd + R**)
2. Xcode compilará el proyecto (primera vez tarda 3-5 minutos)
3. El simulador de iOS se abrirá automáticamente
4. La app se instalará y abrirá en el simulador

### 7.3 Probar funcionalidad básica

**ResidenteApp:**
1. Ingresa número de casa (ej: 42)
2. Selecciona condominio
3. Ingresa nombre del visitante
4. Ingresa nombre del residente
5. Click "Generar Nuevo Código"
6. Verifica que aparezca el QR con toda la información

**VigilanciaApp:**
1. Verifica que se vean las estadísticas del día
2. Ingresa un código QR alfanumérico (ej: ABC123)
3. Click "Validar Código"

### 7.4 Si hay errores de compilación

Revisa la consola de Xcode (panel inferior). Errores comunes:
- **"Command PhaseScriptExecution failed"** → Limpia build: Product → Clean Build Folder
- **"Pod install error"** → Cierra Xcode, corre `pod install` de nuevo

---

## 8. Probar en iPhone Real

Para generar un IPA, primero debes probar que la app funciona en un iPhone real.

### 8.1 Conectar iPhone via cable

1. Conecta tu iPhone a la Mac con un cable Lightning o USB-C
2. Desbloquea el iPhone
3. Si aparece un aviso "Trust This Computer", tap en **"Trust"**
4. Ingresa el código de desbloqueo del iPhone

### 8.2 Seleccionar tu iPhone en Xcode

1. En Xcode, en la barra superior, click en el selector de dispositivo
2. Tu iPhone debería aparecer en la lista (ej: "Papayo's iPhone")
3. Selecciónalo

### 8.3 Ejecutar la app en el iPhone

1. Click en ▶️ **Play** (o Cmd + R)
2. Xcode compilará y transferirá la app al iPhone
3. **PRIMERA VEZ:** Verás un error: *"Untrusted Developer"*

### 8.4 Confiar en el desarrollador

**En tu iPhone:**
1. Ve a **Settings** (Configuración)
2. Tap en **General**
3. Scroll hasta **VPN & Device Management**
4. Tap en tu email: **qrcasasok@gmail.com**
5. Tap en **"Trust qrcasasok@gmail.com"**
6. Confirma con **"Trust"**

### 8.5 Volver a ejecutar

1. En Xcode, click ▶️ Play de nuevo
2. La app ahora se instalará y abrirá en tu iPhone
3. Prueba todas las funcionalidades:
   - ✅ Generar QR en ResidenteApp
   - ✅ Validar QR en VigilanciaApp
   - ✅ Verificar conexión al backend de Render
   - ✅ Capturar fotos de INE en VigilanciaApp

---

## 9. Generar Archive

Un "Archive" es una versión optimizada y empaquetada de la app lista para distribución.

### 9.1 Cambiar esquema de compilación a Release

1. En Xcode, menu: **Product** → **Scheme** → **Edit Scheme...**
2. En el panel izquierdo, selecciona **"Run"**
3. Pestaña **"Info"**
4. Cambia **"Build Configuration"** de **Debug** a **Release**
5. Click **"Close"**

### 9.2 Seleccionar "Any iOS Device"

1. En la barra superior de Xcode, click en el selector de dispositivo
2. Selecciona **"Any iOS Device (arm64)"**
3. Esto compilará para todos los iPhones (no simuladores)

### 9.3 Generar el Archive

1. Menu: **Product** → **Archive**
2. Xcode compilará la app en modo Release (tarda 5-10 minutos)
3. Verás el progreso en la barra superior
4. Cuando termine, se abrirá la ventana **"Organizer"**

### 9.4 Ventana Organizer

El **Organizer** muestra todos los archives que has creado:

```
ResidenteApp
├── Today
│   └── ResidenteApp 1.0.0 (1) - Oct 20, 2025, 3:45 PM
└── Older...
```

Cada archive muestra:
- Nombre de la app
- Versión (1.0.0)
- Build number (1)
- Fecha y hora de creación

---

## 10. Exportar IPA Ad Hoc

"Ad Hoc" es un tipo de distribución que permite instalar la app en dispositivos específicos registrados.

### 10.1 Abrir Organizer (si se cerró)

1. Menu: **Window** → **Organizer**
2. Tab: **Archives**

### 10.2 Seleccionar el archive

1. En la lista de archives, selecciona el más reciente de **ResidenteApp**
2. Click en el botón **"Distribute App"** (lado derecho)

### 10.3 Seleccionar método de distribución

Se abrirá un asistente con opciones:

1. Selecciona: **"Ad Hoc"**
   - ❌ NO selecciones "App Store Connect" (requiere cuenta de pago)
   - ❌ NO selecciones "Development" (solo para pruebas internas)
2. Click **"Next"**

### 10.4 Opciones de distribución

**Pantalla "App Thinning":**
- Selecciona: **"None"** (para compatibilidad máxima)
- Click **"Next"**

**Pantalla "Re-sign":**
- Deja las opciones por defecto
- Verifica que aparezca tu certificado: **qrcasasok@gmail.com**
- Click **"Next"**

**Pantalla "Review":**
- Revisa la información del IPA
- Verifica Bundle ID: `com.qrmanager.residentes`
- Verifica Version: 1.0.0
- Click **"Export"**

### 10.5 Guardar el IPA

1. Se abrirá un diálogo para guardar el archivo
2. Navega a:
   ```
   /Users/papayo/Desktop/QR/QR_manager/ios/ipa/ResidenteApp/
   ```
3. Nombra el archivo: **`ResidenteApp_v1.0.0_build1.ipa`**
4. Click **"Export"**
5. Xcode generará el IPA (tarda 1-2 minutos)
6. Verás una carpeta con:
   - `ResidenteApp.ipa` ← Este es tu archivo
   - `DistributionSummary.plist`
   - `ExportOptions.plist`
   - `Packaging.log`

### 10.6 Repetir para VigilanciaApp

1. Abre `VigilanciaApp.xcworkspace`
2. Product → Archive
3. Distribute App → Ad Hoc
4. Guardar en: `/ios/ipa/VigilanciaApp/VigilanciaApp_v1.0.0_build1.ipa`

---

## 11. Instalar IPA en Dispositivos

Con el IPA generado, puedes instalarlo en iPhones.

### 11.1 Via Xcode (Método más fácil)

**Paso 1: Abrir Devices & Simulators**
1. En Xcode, menu: **Window** → **Devices and Simulators**
2. Tab: **Devices** (no Simulators)

**Paso 2: Conectar iPhone**
1. Conecta tu iPhone via cable
2. Desbloquea el iPhone
3. Aparecerá en la lista lateral izquierda

**Paso 3: Instalar IPA**
1. Selecciona tu iPhone en la lista
2. En el panel central, sección **"Installed Apps"**
3. Click en el botón **"+"** (abajo)
4. Navega a `/ios/ipa/ResidenteApp/ResidenteApp_v1.0.0_build1.ipa`
5. Selecciona el archivo IPA
6. Click **"Open"**
7. Xcode instalará la app (tarda ~30 segundos)
8. Verás "ResidenteApp" en la lista de apps instaladas

**Paso 4: Confiar en el desarrollador (si es la primera vez)**
- Igual que en la sección 8.4
- Settings → General → VPN & Device Management → Trust

### 11.2 Via Apple Configurator 2 (Alternativa)

Si prefieres otra herramienta:

1. Descarga **Apple Configurator 2** desde Mac App Store
2. Abre Apple Configurator 2
3. Conecta iPhone
4. Arrastra el archivo `.ipa` sobre la imagen del iPhone
5. La app se instalará automáticamente

### 11.3 Instalar en múltiples iPhones

**Con cuenta gratuita:**
- ⚠️ Solo puedes instalar en dispositivos que hayas registrado
- ⚠️ Máximo ~100 dispositivos por año
- ⚠️ Cada dispositivo debe estar conectado via cable

**Con cuenta de pago ($99/año):**
- ✅ Usa TestFlight para distribución inalámbrica
- ✅ Hasta 10,000 dispositivos beta testers
- ✅ No necesitas cable para instalar

---

## 12. Preparar para TestFlight

TestFlight es la plataforma oficial de Apple para distribución beta. **Requiere cuenta de pago**.

### 12.1 Actualizar a cuenta de pago

1. Ve a: https://developer.apple.com
2. Click en **"Account"**
3. Click en **"Join the Apple Developer Program"**
4. Completa el formulario de inscripción
5. Paga $99 USD (renovación anual)
6. Espera aprobación (1-2 días)

### 12.2 Crear apps en App Store Connect

**Una vez aprobada tu cuenta de pago:**

1. Ve a: https://appstoreconnect.apple.com
2. Login con qrcasasok@gmail.com
3. Click en **"My Apps"**
4. Click en **"+"** → **"New App"**

**Para ResidenteApp:**
- Platform: **iOS**
- Name: **QR Residentes** (o "ResidenteApp")
- Primary Language: **Spanish (Mexico)**
- Bundle ID: **com.qrmanager.residentes**
- SKU: **qr-residentes-001**
- User Access: **Full Access**

**Para VigilanciaApp:**
- Platform: **iOS**
- Name: **QR Vigilancia** (o "VigilanciaApp")
- Primary Language: **Spanish (Mexico)**
- Bundle ID: **com.qrmanager.vigilancia**
- SKU: **qr-vigilancia-001**
- User Access: **Full Access**

### 12.3 Subir build a TestFlight

**En Xcode:**
1. Product → Archive (como antes)
2. Organizer → Distribute App
3. Esta vez selecciona: **"App Store Connect"** (ahora disponible)
4. Next → Upload
5. Xcode subirá el build (tarda 5-15 minutos)

**En App Store Connect:**
1. Espera ~5 minutos a que procese el build
2. Ve a tu app → TestFlight
3. El build aparecerá en "Builds"
4. Agrega información de prueba requerida
5. Click en **"Start Testing"**

### 12.4 Invitar beta testers

1. En TestFlight, sección **"Internal Testing"** o **"External Testing"**
2. Click **"+"** para agregar testers
3. Ingresa emails de los residentes
4. Envía invitaciones
5. Los residentes recibirán email con enlace a TestFlight
6. Descargan app **TestFlight** de App Store
7. Instalan tu app desde TestFlight

**Ventajas de TestFlight:**
- ✅ Instalación inalámbrica (sin cable)
- ✅ Actualizaciones automáticas
- ✅ Feedback de usuarios
- ✅ Hasta 10,000 beta testers
- ✅ Builds válidos por 90 días

---

## 13. Solución de Problemas

### Problema: "Failed to create provisioning profile"

**Causa:** Cuenta gratuita tiene limitaciones.

**Solución:**
1. Ve a developer.apple.com → Account → Certificates, IDs & Profiles
2. Registra tu iPhone manualmente:
   - Devices → "+" → Ingresa UDID de tu iPhone
   - El UDID lo encuentras en Xcode (Devices & Simulators → selecciona iPhone → Identifier)

### Problema: "App installation failed"

**Causa:** Certificado expirado o dispositivo no confiado.

**Solución:**
1. Elimina la app del iPhone
2. En Xcode, Product → Clean Build Folder
3. Revoca certificados viejos en developer.apple.com
4. Vuelve a compilar

### Problema: "The app could not be installed because the bundle identifier has already been used"

**Causa:** Ya existe una app con ese Bundle ID.

**Solución:**
1. Elimina la app del iPhone
2. O cambia el Bundle ID agregando un sufijo: `com.qrmanager.residentes.v2`

### Problema: "Pod install failed"

**Causa:** Dependencias corruptas o permisos.

**Solución:**
```bash
cd /Users/papayo/Desktop/QR/QR_manager/ios/ResidenteApp/ios
rm -rf Pods Podfile.lock
pod install
```

### Problema: "Signing for ResidenteApp requires a development team"

**Causa:** No has seleccionado un Team en Code Signing.

**Solución:**
1. Xcode → Proyecto → Signing & Capabilities
2. Marca "Automatically manage signing"
3. Selecciona tu team (qrcasasok@gmail.com)

---

## 14. Cuenta Gratuita vs De Pago

| Característica | Cuenta Gratuita | Cuenta de Pago ($99/año) |
|----------------|-----------------|--------------------------|
| **Probar en iPhone** | ✅ Sí | ✅ Sí |
| **Generar IPA** | ✅ Sí (Ad Hoc) | ✅ Sí (todos los tipos) |
| **TestFlight** | ❌ No | ✅ Sí (10,000 testers) |
| **App Store** | ❌ No | ✅ Sí |
| **Certificados expiran** | ⚠️ 7 días | ✅ 1 año |
| **App instalada expira** | ⚠️ 7 días | ✅ No expira |
| **Apps simultáneas** | ⚠️ Máximo 3 | ✅ Ilimitadas |
| **Distribución** | ⚠️ Solo cable | ✅ Inalámbrica via TestFlight |
| **Dispositivos registrados** | ~100/año | ✅ Ilimitados (TestFlight) |

### Recomendación:

**Para desarrollo inicial y pruebas:**
- Usa cuenta gratuita
- Instala en tu iPhone para probar
- Genera IPAs para pruebas internas

**Para distribuir a residentes:**
- Actualiza a cuenta de pago ($99/año)
- Usa TestFlight para distribución beta
- Los residentes instalan fácilmente desde TestFlight
- Actualizaciones automáticas

---

## 15. Actualizar Apps Después de Cambios

Cuando hagas cambios en el código y quieras regenerar las IPAs:

### 15.1 Incrementar Build Number

1. En Xcode, selecciona proyecto → target
2. Tab: **"General"**
3. En **"Identity"**:
   - **Version:** 1.0.0 (mantenlo igual si no hay cambios grandes)
   - **Build:** Incrementa de `1` a `2`, luego `3`, etc.

### 15.2 Commit cambios a Git

```bash
cd /Users/papayo/Desktop/QR/QR_manager/backend
git add ios/
git commit -m "iOS: Update to build 2 - [descripción de cambios]"
git push origin main
```

### 15.3 Limpiar build anterior

En Xcode:
1. Menu: **Product** → **Clean Build Folder**
2. O presiona: **Shift + Cmd + K**

### 15.4 Regenerar Archive y IPA

1. Product → Archive
2. Distribute App → Ad Hoc (o App Store Connect)
3. Guardar como: `ResidenteApp_v1.0.0_build2.ipa`

### 15.5 Actualizar README.md con versión

Edita `/ios/ipa/README.md`:

```markdown
## ResidenteApp (com.qrmanager.residentes)
| Versión | Build | Fecha | Archivo | Notas |
|---------|-------|-------|---------|-------|
| 1.0.0 | 2 | Oct 21, 2025 | ResidenteApp_v1.0.0_build2.ipa | Fix teclado |
| 1.0.0 | 1 | Oct 20, 2025 | ResidenteApp_v1.0.0_build1.ipa | Primera versión |
```

---

## Resumen de Comandos Útiles

### Limpiar pods y reinstalar:
```bash
cd /Users/papayo/Desktop/QR/QR_manager/ios/ResidenteApp/ios
rm -rf Pods Podfile.lock
export LANG=en_US.UTF-8
pod install
```

### Ver UDID del iPhone:
1. Conectar iPhone
2. Xcode → Window → Devices and Simulators
3. Seleccionar iPhone → Identifier

### Ver logs de Xcode en consola:
```bash
tail -f ~/Library/Logs/CoreSimulator/*/system.log
```

### Eliminar certificados vencidos:
1. Abrir **Keychain Access**
2. Buscar "Apple Development"
3. Eliminar los que dicen "Expired"

---

## Próximos Pasos

1. ✅ **Ahora:** Genera IPAs con cuenta gratuita y prueba en tu iPhone
2. ⏳ **Pronto:** Actualiza a cuenta de pago ($99/año)
3. 🚀 **Después:** Distribuye a residentes via TestFlight
4. 📱 **Opcional:** Publica en App Store

---

## Soporte

**Problemas con esta guía:**
- Revisa la sección [13. Solución de Problemas](#13-solución-de-problemas)
- Consulta la documentación oficial de Xcode

**Problemas con el backend:**
- Verifica que Render esté activo: https://qr-manager-3z8x.onrender.com/health
- Revisa logs en dashboard.render.com

**Problemas con las apps:**
- Verifica que estén conectadas al backend de Render
- Revisa que los Bundle IDs sean correctos

---

**¡Éxito generando tus IPAs!** 🎉

---

*Documentación generada con Claude Code*
*Última actualización: Octubre 2025*
