# 📱 Cómo Aplicar los Cambios a las Apps Instaladas

## ✅ Cambios Realizados (Sin Compilar)

### VigilanciaApp:
1. ✅ Botón "Salir" agregado en el dashboard
2. ✅ Función de cerrar sesión que limpia AsyncStorage

### ResidenteApp:
1. ✅ Botón "Salir" agregado en HomeScreen
2. ✅ Función shareCode mejorada para compartir **imagen QR + texto**
3. ✅ Servicio de notificaciones preparado (requiere compilar para activar)
4. ✅ Configuración de notificaciones en app.json

---

## 🚀 OPCIÓN 1: EAS Update (Actualización OTA) - RECOMENDADA

### Requisitos Previos:
Las apps deben haber sido compiladas con soporte de EAS Update. Si NO se compilaron con esto, debes usar la Opción 2.

###  ¿Cómo verificar si las apps tienen EAS Update?
```bash
# ResidenteApp
cd iOS/ResidenteApp
npx expo-updates:codesigning:configure

# Si muestra error "EAS Update not configured", necesitas recompilar (Opción 2)
```

### Si las apps SÍ tienen EAS Update:

```bash
# 1. Commit los cambios
cd iOS/ResidenteApp
git add .
git commit -m "Mejoras: Botón salir y compartir QR con imagen"

# 2. Publicar actualización OTA
eas update --branch production --message "Mejoras UI y share QR"

# 3. Hacer lo mismo para VigilanciaApp
cd ../VigilanciaApp
git add .
git commit -m "Mejoras: Botón salir agregado"
eas update --branch production --message "Botón salir agregado"
```

**Resultado:**
- ⏱️ Los usuarios recibirán la actualización en ~10-15 minutos
- 📱 NO necesitan reinstalar desde App Store
- ✅ Cambios se aplican automáticamente al abrir la app

---

## 🔨 OPCIÓN 2: Recompilar y Redistribuir (NECESARIA si no hay EAS Update)

### Esta opción es NECESARIA si:
- ❌ Las apps NO fueron compiladas con EAS Update
- ❌ Necesitas activar las notificaciones push
- ❌ Agregaste nuevas dependencias nativas

### Pasos:

#### 1. Incrementar versión en app.json

**ResidenteApp:**
```json
{
  "expo": {
    "version": "1.0.5",
    "ios": {
      "buildNumber": "8"
    }
  }
}
```

**VigilanciaApp:**
```json
{
  "expo": {
    "version": "1.0.5",
    "ios": {
      "buildNumber": "8"
    }
  }
}
```

#### 2. Compilar nueva versión

```bash
# ResidenteApp
cd iOS/ResidenteApp
eas build --platform ios --profile production

# VigilanciaApp
cd ../VigilanciaApp
eas build --platform ios --profile production
```

⏱️ Cada compilación tarda ~30-40 minutos

#### 3. Subir a TestFlight/App Store

```bash
# Cuando termine el build
cd iOS/ResidenteApp
eas submit --platform ios

cd ../VigilanciaApp
eas submit --platform ios
```

#### 4. Aprobar en App Store Connect

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Selecciona cada app
3. Ve a TestFlight
4. Aprobar el nuevo build
5. Distribuir a testers

**Resultado:**
- 📱 Los usuarios verán la actualización disponible en la App Store/TestFlight
- ⏱️ Proceso completo: ~1-2 horas
- ✅ Incluye TODOS los cambios (botones salir, share QR, etc.)

---

## 🔔 OPCIÓN 3: Activar Notificaciones Push (Requiere Compilar)

Si deseas activar las notificaciones cuando se valida un código QR:

### 1. Instalar dependencias

```bash
cd iOS/ResidenteApp
npx expo install expo-notifications expo-device
```

### 2. Descomentar código

Abre: `iOS/ResidenteApp/src/services/notifications.ts`

Descomentar todas las líneas marcadas con:
```typescript
// DESCOMENTAR CUANDO SE INSTALE expo-notifications:
```

### 3. Configurar Backend

Implementar el código de `BACKEND_NOTIFICATION_EXAMPLE.js`:

```bash
# En el repositorio del backend
cd backend
npm install expo-server-sdk

# Agregar endpoints y lógica de notificaciones
# (Ver archivo BACKEND_NOTIFICATION_EXAMPLE.js para código completo)
```

### 4. Recompilar app

```bash
cd iOS/ResidenteApp
# Incrementar version a 1.0.5, buildNumber a 8
eas build --platform ios --profile production
eas submit --platform ios
```

### 5. Probar

1. Instalar nueva versión desde TestFlight
2. Abrir ResidenteApp → Aceptar permisos de notificaciones
3. Generar código QR
4. Desde VigilanciaApp, validar el código
5. 🔔 Debes recibir notificación en ResidenteApp

**Nota:** Las notificaciones SOLO funcionan en dispositivos físicos, NO en simulador.

---

## 📊 Comparación de Opciones

| Característica | EAS Update | Recompilar | Con Notificaciones |
|----------------|------------|------------|-------------------|
| Tiempo | ~15 min | ~2 horas | ~2 horas |
| Reinstalar app | ❌ NO | ✅ SÍ | ✅ SÍ |
| Botón Salir | ✅ | ✅ | ✅ |
| Share QR mejorado | ✅ | ✅ | ✅ |
| Notificaciones Push | ❌ | ❌ | ✅ |
| Requiere compilar | ❌ | ✅ | ✅ |

---

## 🎯 Recomendación

### Para aplicar SOLO los cambios actuales (botones salir y share QR):

**Si las apps tienen EAS Update configurado:**
→ Usa **OPCIÓN 1** (rápido, sin reinstalar)

**Si las apps NO tienen EAS Update:**
→ Usa **OPCIÓN 2** (recompilar y redistribuir)

### Para agregar notificaciones push:
→ Usa **OPCIÓN 3** (requiere recompilar de todas formas)

---

## ❓ ¿Cómo saber qué opción usar?

```bash
cd iOS/ResidenteApp

# Intenta publicar un update
eas update --branch production --message "Test"

# Si funciona → Usa OPCIÓN 1
# Si da error → Usa OPCIÓN 2
```

---

## 📝 Archivos Modificados

### ResidenteApp:
- `src/screens/HomeScreen.tsx` - Botón salir y share QR
- `src/services/notifications.ts` - Servicio de notificaciones (NUEVO)
- `app.json` - Configuración de notificaciones
- `.gitignore` - Ignorar node_modules

### VigilanciaApp:
- `src/screens/DashboardScreen.tsx` - Botón salir
- `.gitignore` - Ignorar node_modules

### Documentación:
- `BACKEND_NOTIFICATION_EXAMPLE.js` - Código backend para notificaciones
- `GUIA_ACTUALIZACION_NOTIFICACIONES.md` - Guía completa de notificaciones
- `COMO_APLICAR_CAMBIOS.md` - Este archivo

---

## 🆘 Solución de Problemas

### "eas update failed"
→ Las apps necesitan ser recompiladas con soporte EAS Update
→ Usa OPCIÓN 2 (recompilar)

### "No changes detected"
→ Asegúrate de hacer git commit antes de `eas update`

### "Build failed"
→ Verifica que las credenciales de iOS estén configuradas:
```bash
eas credentials
```

### "Users not receiving updates"
→ Los usuarios deben cerrar y volver a abrir la app
→ Las actualizaciones OTA se descargan al abrir la app

---

¿Necesitas ayuda? Revisa los logs con:
```bash
eas build:list
eas update:list --branch production
```
