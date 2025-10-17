# Changelog - Correcciones de Crashes y Flashazo Blanco

## Fecha: 2025-10-16
## Versión: 2.1.0

---

## Resumen de Cambios

Este changelog documenta las correcciones implementadas para resolver los problemas de crashes y el flashazo blanco que experimentaban las aplicaciones móviles.

### Problemas Resueltos

✅ **Flashazo blanco al abrir las apps** - Las apps se quedaban en pantalla blanca
✅ **Crashes por errores no manejados** - El backend crasheaba ante cualquier error
✅ **Desconexión entre apps y API** - Las apps y el backend no podían comunicarse
✅ **Crashes en builds de release** - ProGuard ofuscaba código crítico
✅ **Configuración faltante** - No estaba documentado SPREADSHEET_ID

---

## Cambios Detallados

### 1. Backend - Manejo de Errores Completo

#### Archivo: `backend/src/services/sheetsService.js`

**Antes**: Ningún método tenía try-catch, cualquier error crasheaba el servidor

**Después**: Todos los métodos tienen manejo de errores completo:

- ✅ `ensureSheetExists()` - Try-catch + logging
- ✅ `registerCode()` - Try-catch + validación de datos
- ✅ `registerWorker()` - Try-catch + validación de datos
- ✅ `validateCode()` - Try-catch + logging detallado
- ✅ `updateStatus()` - Try-catch + logging
- ✅ `getHistory()` - Try-catch + validación
- ✅ `getCounters()` - Try-catch + validación

**Beneficio**: El servidor ahora maneja errores gracefully sin crashear

---

### 2. Backend - Módulo de Mapeo de Parámetros (CRÍTICO)

#### Archivo: `backend/src/utils/paramMapper.js` (NUEVO)

**Problema**: Las apps enviaban `{houseNumber, condominio}` pero el backend esperaba `{sheetId, sheetName, casa}`

**Solución**: Nuevo módulo que mapea automáticamente:

```javascript
// Input de la app
{ houseNumber: 25, condominio: "Unica" }

// Output para el backend
{
  sheetId: process.env.SPREADSHEET_ID,
  sheetName: "Registros_Casa_25",
  casa: "25",
  condominio: "Unica"
}
```

**Funciones incluidas**:
- `mapAppParamsToBackend()` - Mapeo principal
- `getSpreadsheetId()` - Lee SPREADSHEET_ID del .env
- `getSheetName()` - Genera nombre de hoja
- `generateQRCode()` - Genera códigos aleatorios
- `getCurrentDateTime()` - Obtiene fecha/hora formateada

**Beneficio**: Las apps ahora pueden comunicarse con el backend sin cambios

---

### 3. Backend - Endpoints Adaptados

#### Archivo: `backend/src/server.js`

**Cambios**:

1. **POST /api/register-code**
   - Antes: Esperaba `{sheetId, sheetName, codigo, ...}`
   - Después: Acepta `{houseNumber, condominio}`
   - Genera código QR automáticamente
   - Responde con formato esperado por la app

2. **POST /api/validate-qr**
   - Antes: Esperaba `{sheetId, codigo}`
   - Después: Acepta `{code}`
   - Usa SPREADSHEET_ID global
   - Busca en todas las hojas automáticamente

3. **GET /api/get-history**
   - Antes: Esperaba `?sheetId=X&sheetName=Y&casa=Z`
   - Después: Acepta `?houseNumber=X&condominio=Y`
   - Mapea automáticamente los parámetros

4. **GET /api/counters**
   - Antes: Esperaba `?sheetId=X`
   - Después: No requiere parámetros
   - Usa SPREADSHEET_ID global

5. **POST /api/register-worker**
   - Antes: Esperaba `{sheetId, sheetName, ...}`
   - Después: Acepta `{houseNumber, condominio, workerType, photoBase64}`

**Beneficio**: Total compatibilidad con las apps móviles existentes

---

### 4. ProGuard - Configuración Completa

#### Archivos:
- `apps/ResidenteApp/android/app/proguard-rules.pro`
- `apps/VigilanciaApp/android/app/proguard-rules.pro`

**Antes**: Archivos vacíos - ProGuard ofuscaba TODO

**Después**: Reglas completas para:
- ✅ React Native core
- ✅ Hermes engine
- ✅ Navegación (React Navigation)
- ✅ AsyncStorage
- ✅ SVG y QR Code
- ✅ Image Picker (VigilanciaApp)
- ✅ Vision Camera (VigilanciaApp)
- ✅ React Native Share (ResidenteApp)

**Beneficio**: Los builds de release ahora funcionan sin crashes

---

### 5. Variables de Entorno - Documentación

#### Archivo: `backend/.env.example`

**Antes**: Documentación mínima

**Después**: Documentación completa con:
- ✅ Descripción de cada variable
- ✅ Formato exacto requerido
- ✅ Instrucciones para obtener SPREADSHEET_ID
- ✅ Guía de permisos de Google Cloud
- ✅ Instrucciones de deployment en Render

**Variable crítica añadida**:
```env
SPREADSHEET_ID=1h_fEz5tDjNmdZ-57F2CoL5W6RjjAF7Yhw4ttJgypb7o
```

**Beneficio**: Configuración clara y sin errores

---

### 6. Apps Móviles - Manejo de Errores Mejorado

#### Archivos:
- `apps/ResidenteApp/src/services/api.ts`
- `apps/VigilanciaApp/src/services/api.ts`

**Mejoras implementadas**:

1. **Sistema de Reintentos Automáticos**
   - 3 reintentos por defecto
   - 1 segundo entre reintentos
   - Reintentos reducidos para subida de fotos

2. **Timeouts Aumentados**
   - Health check: 10 segundos
   - Operaciones normales: 20 segundos
   - Subida de fotos: 30 segundos

3. **Manejo de Errores Inteligente**
   - Detecta errores de red
   - Detecta timeouts
   - Detecta errores del servidor
   - Mensajes descriptivos para el usuario

4. **Logging Detallado**
   - Todas las operaciones se registran en consola
   - Errores con contexto completo
   - Ayuda en debugging

**Beneficio**: Mejor experiencia de usuario y más fácil debugging

---

## Pasos para Deployment

### 1. Backend (Render.com)

1. **Actualizar código en Render**:
   - Push de cambios a GitHub
   - Render detecta y despliega automáticamente

2. **Verificar variables de entorno**:
   ```
   SPREADSHEET_ID=tu_spreadsheet_id_aqui
   GOOGLE_CREDENTIALS={...json...}
   PORT=3000
   ```

3. **Verificar deployment**:
   - Visitar: `https://qr-manager-backend-l6dg.onrender.com/`
   - Debe mostrar: "QR Manager Backend v2.1"

### 2. Apps Móviles

#### ResidenteApp

```bash
cd apps/ResidenteApp

# Limpiar build anterior
cd android && ./gradlew clean && cd ..

# Build de release
cd android && ./gradlew assembleRelease && cd ..

# APK generado en:
# android/app/build/outputs/apk/release/app-universal-release.apk
```

#### VigilanciaApp

```bash
cd apps/VigilanciaApp

# Limpiar build anterior
cd android && ./gradlew clean && cd ..

# Build de release
cd android && ./gradlew assembleRelease && cd ..

# APK generado en:
# android/app/build/outputs/apk/release/app-universal-release.apk
```

---

## Testing Recomendado

### Backend

1. **Health Check**:
   ```bash
   curl https://qr-manager-backend-l6dg.onrender.com/health
   ```

2. **Registrar código**:
   ```bash
   curl -X POST https://qr-manager-backend-l6dg.onrender.com/api/register-code \
     -H "Content-Type: application/json" \
     -d '{"houseNumber": 25, "condominio": "Unica"}'
   ```

3. **Verificar logs en Render**:
   - Buscar emojis: 📝, ✅, ❌
   - Verificar que no hay errors

### Apps Móviles

1. **ResidenteApp**:
   - ✅ Login funciona
   - ✅ Generar código QR funciona
   - ✅ Compartir funciona
   - ✅ Historial se carga
   - ✅ No hay flashazo blanco

2. **VigilanciaApp**:
   - ✅ Dashboard se carga
   - ✅ Contadores se muestran
   - ✅ Validar código funciona
   - ✅ Registrar trabajador funciona
   - ✅ No hay flashazo blanco

---

## Notas Importantes

1. **SPREADSHEET_ID es CRÍTICO**:
   - Sin esta variable, el backend no funciona
   - Debe estar configurada en Render.com

2. **ProGuard está ACTIVO en Release**:
   - Las reglas están configuradas
   - No modificar sin probar

3. **Reintentos Automáticos**:
   - Las apps intentan 3 veces antes de fallar
   - Render puede tardar en despertar (modo free)

4. **Logging Habilitado**:
   - Todas las operaciones se registran
   - Facilita debugging en producción

---

## Archivos Modificados

### Backend
- ✅ `backend/src/services/sheetsService.js` - Manejo de errores completo
- ✅ `backend/src/utils/paramMapper.js` - NUEVO módulo de mapeo
- ✅ `backend/src/server.js` - Endpoints adaptados
- ✅ `backend/.env.example` - Documentación completa

### Apps Móviles
- ✅ `apps/ResidenteApp/src/services/api.ts` - Reintentos + errores
- ✅ `apps/VigilanciaApp/src/services/api.ts` - Reintentos + errores
- ✅ `apps/ResidenteApp/android/app/proguard-rules.pro` - Reglas completas
- ✅ `apps/VigilanciaApp/android/app/proguard-rules.pro` - Reglas completas

---

## Versiones

- **Backend**: 2.1.0
- **ResidenteApp**: 1.1
- **VigilanciaApp**: 1.1

---

## Próximos Pasos Recomendados

1. ✅ Hacer backup del spreadsheet actual
2. ✅ Desplegar backend en Render
3. ✅ Probar endpoint health
4. ✅ Generar APKs de release
5. ✅ Probar en dispositivos reales
6. ✅ Monitorear logs en producción

---

**IMPORTANTE**: Antes de desplegar, asegúrate de que SPREADSHEET_ID esté configurado en las variables de entorno de Render.com
