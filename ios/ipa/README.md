# IPAs Generadas - QR Manager

Archivos .ipa para distribución de las apps iOS.

---

## ResidenteApp (com.qrmanager.residentes)

| Versión | Build | Fecha | Archivo | Tamaño | Notas |
|---------|-------|-------|---------|--------|-------|
| 1.0.0 | 1 | - | Pendiente generar | - | Primera versión con campos visitante/residente |

**Cambios principales en v1.0.0:**
- ✅ Inputs obligatorios para visitante y residente
- ✅ Mostrar visitante, residente y fecha en QR activo
- ✅ Historial mejorado con todos los datos
- ✅ Fix error al cargar historial
- ✅ KeyboardAvoidingView para mejor UX
- ✅ Conectado a backend Render

---

## VigilanciaApp (com.qrmanager.vigilancia)

| Versión | Build | Fecha | Archivo | Tamaño | Notas |
|---------|-------|-------|---------|--------|-------|
| 1.0.0 | 1 | - | Pendiente generar | - | Primera versión con teclado alfanumérico |

**Cambios principales en v1.0.0:**
- ✅ Teclado alfanumérico para códigos QR
- ✅ KeyboardAvoidingView para mejor UX
- ✅ Validación de códigos de 6 caracteres (letras y números)
- ✅ Registro de trabajadores con foto de INE
- ✅ Upload de fotos a Google Drive
- ✅ Estadísticas del día
- ✅ Conectado a backend Render

---

## Información Técnica

### Bundle Identifiers:
- **ResidenteApp:** `com.qrmanager.residentes`
- **VigilanciaApp:** `com.qrmanager.vigilancia`

### Requisitos iOS:
- **Mínimo:** iOS 13.4
- **Recomendado:** iOS 16.0+
- **Arquitectura:** arm64 (iPhones)

### Backend:
- **URL:** https://qr-manager-3z8x.onrender.com
- **Versión:** 2.1
- **Health Check:** https://qr-manager-3z8x.onrender.com/health

### Apple Developer:
- **Account:** qrcasasok@gmail.com
- **Tipo:** Gratuita (actualizar a $99/año para TestFlight)

---

## Cómo usar este directorio

### Generar nuevas IPAs:
1. Sigue la guía completa en [`GUIA_IOS.md`](./GUIA_IOS.md)
2. Guarda los archivos .ipa aquí con nomenclatura:
   - `ResidenteApp_v1.0.0_build1.ipa`
   - `ResidenteApp_v1.0.0_build2.ipa`
   - etc.

### Nombrar archivos:
```
[NombreApp]_v[Version]_build[Build].ipa

Ejemplos:
ResidenteApp_v1.0.0_build1.ipa
ResidenteApp_v1.0.1_build3.ipa
VigilanciaApp_v1.0.0_build1.ipa
```

### Actualizar tabla:
Cuando generes un nuevo IPA, actualiza la tabla correspondiente arriba con:
- Fecha de generación
- Nombre del archivo
- Tamaño aproximado
- Notas sobre cambios incluidos

---

## Distribución

### Método Actual (Cuenta Gratuita):
1. Generar IPA Ad Hoc siguiendo `GUIA_IOS.md`
2. Instalar via Xcode en dispositivos registrados
3. Reinstalar cada 7 días (apps expiran)

### Método Recomendado (Cuenta de Pago - $99/año):
1. Generar IPA para App Store Connect
2. Subir a TestFlight
3. Invitar a residentes como beta testers
4. Residentes instalan desde app TestFlight
5. Actualizaciones automáticas

---

## Instalación

### Via Xcode (Cable):
```bash
1. Xcode → Window → Devices and Simulators
2. Conectar iPhone via cable
3. Arrastrar archivo .ipa a lista de apps
4. Esperar instalación (~30 segundos)
```

### Via TestFlight (Requiere cuenta de pago):
```bash
1. Residentes descargan app TestFlight de App Store
2. Reciben invitación via email
3. Click en enlace de invitación
4. App se instala desde TestFlight
5. Actualizaciones automáticas cuando subes nuevos builds
```

---

## Versionado

Usamos **Semantic Versioning** (MAJOR.MINOR.PATCH):

- **MAJOR** (1.x.x): Cambios incompatibles en API o funcionalidad
- **MINOR** (x.1.x): Nuevas funcionalidades compatibles
- **PATCH** (x.x.1): Correcciones de bugs

**Build Number:** Incrementa secuencialmente (1, 2, 3...) con cada nueva compilación.

### Ejemplos:
- `v1.0.0 build 1` → Primera versión pública
- `v1.0.0 build 2` → Mismo features, fix bugs
- `v1.0.1 build 3` → Pequeña mejora o fix
- `v1.1.0 build 4` → Nueva funcionalidad agregada
- `v2.0.0 build 5` → Cambio mayor en funcionalidad

---

## Certificados y Provisioning Profiles

### Con Cuenta Gratuita:
- ⚠️ Certificados expiran cada 7 días
- ⚠️ Apps instaladas expiran cada 7 días
- ⚠️ Máximo 3 apps activas simultáneamente

### Con Cuenta de Pago:
- ✅ Certificados válidos por 1 año
- ✅ Apps no expiran
- ✅ Apps ilimitadas

### Renovar certificados:
1. Xcode maneja automáticamente si tienes "Automatically manage signing"
2. O manualmente en developer.apple.com → Certificates, IDs & Profiles

---

## Changelog

### Version 1.0.0 (Pendiente)
**ResidenteApp:**
- Inputs obligatorios: visitante y residente
- Mostrar información completa en QR
- Historial mejorado
- Fix error de carga
- KeyboardAvoidingView

**VigilanciaApp:**
- Teclado alfanumérico
- KeyboardAvoidingView
- Validación códigos 6 caracteres
- Captura de INE
- Upload a Google Drive

---

## Notas Importantes

### ⚠️ NUNCA subir archivos .ipa a Git
Los archivos .ipa son grandes (50-100 MB) y no deben estar en el repositorio.
Ya están excluidos en `.gitignore`.

### ✅ SIEMPRE mantener copia de seguridad
Guarda los archivos .ipa en:
- iCloud Drive
- Google Drive
- Disco externo
- Time Machine

### 📱 Probar SIEMPRE antes de distribuir
1. Instala en tu iPhone primero
2. Prueba todas las funcionalidades
3. Verifica conexión al backend
4. Asegúrate que no hay crashes

---

## Soporte

**Problemas generando IPAs:**
- Consulta [`GUIA_IOS.md`](./GUIA_IOS.md)

**Problemas instalando:**
- Verifica que el dispositivo esté registrado
- Revisa certificados en developer.apple.com
- Intenta limpiar build y regenerar

**Problemas con la app:**
- Verifica backend en https://qr-manager-3z8x.onrender.com/health
- Revisa permisos en Settings del iPhone
- Reinstala la app

---

*Última actualización: Octubre 2025*
