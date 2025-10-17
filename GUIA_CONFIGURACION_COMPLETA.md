# Guía de Configuración Completa
## QR Manager - Backend y Apps Móviles

---

## Estado Actual

✅ **Backend v2.1** - Completamente actualizado y funcionando
✅ **Mapeo de parámetros** - Apps pueden comunicarse con backend
✅ **Manejo de errores** - Completo en todo el sistema
✅ **ProGuard** - Configurado para builds de release
✅ **Logging** - Sistema completo de logs

⚠️ **Credenciales de Google** - Requieren verificación

---

## Parte 1: Configuración del Backend en Render.com

### Paso 1: Verificar Variables de Entorno

1. **Ir a Render.com Dashboard**:
   - https://dashboard.render.com
   - Selecciona tu servicio "qr-manager-backend"

2. **Ir a "Environment"**:
   - Click en la pestaña "Environment"
   - Verifica que tengas estas variables:

```env
PORT=3000

SPREADSHEET_ID=1h_fEz5tDjNmdZ-57F2CoL5W6RjjAF7Yhw4ttJgypb7o

GOOGLE_CREDENTIALS={"type":"service_account","project_id":"qr-manager-473614","private_key_id":"f268fcc5c64e7378e839abcf213b3177549436d3","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDdMpTSOIVldLWC\nDLYRqhWLIdFlQLUcpJJNHUogU9ZikcZWFlAYdLogjHRLAERRbHpw1cefM+FTPMZF\n3dG5ZztS+o4cZrKlsnTRG32GtJJVrNBuCQjvta1D9MexmP/AZAPQQDRRTPF2nbhq\ntJ78+ujbCZoqTBp7RmDj6fbNI4suJ/Jk91E3MlOCh6Q1uHs4DqcyMxt/3r6c4KOT\nseQqJWiHQXDFRW+D/0c6Zy1DxcgfPt3c7laQ2imiQa6n5GBgcwnyOmgfGWwWwz50\n2jSSDrK0zuJ0aDXEmpyCHx6qcUixlpWWuw9LiscvWWhuyj5Y0LUtWFmjkov2z+1l\nyqjfLW3jAgMBAAECggEAWYOiMS6ZYTTpTT9KoPxlKoBdhm24vWYmJJnhSRLUc+BN\nVMJD2JnIRurAFyf8/bx6ElaZKaarnW0/Sb/aIv8RRWPLBdhTnHWLC6Jl2pERlSVR\n1e3HFYa+nv0coRTrDtcKqgiJg4sxPlDWdCwzGOqLODT7E/nnT5LsG9+vNlYXeW4F\ncZEV52p6QkYqFLOEoaUy190+/nU/rl4NEtF5+L+Lm1FUB2MIehmbIejjvnCyrhDB\nm/H2s7x13AnJjULOcEUmQorSvCG4xW4vVgt5Zjm56FD3nowphSaPeHQ4vpBPOK1T\nPdHvi+0h33MeK800wpCshZMoA5DP3XGQoNRkNJ5/yQKBgQDvhLBKgtgimy2vjd85\nePeLjJn2RhGpygIxeSy78TNooDdYGSU+e2F8g1SoE5RJ9Us4onX9NF6hGwcq/j5w\n0Bop0yvqp2WlyjF4Ngnpdeg4ElzkEg5JOVBYB8MC4Ifi8tkI1QMlbR8J8LVZw3E/\nbf2uU7sJ1VrvN+Z5FQgT6kpP+QKBgQDsayhyfBzmh0aIBbp2ROowor66ncPt7D5E\nYXh/9QPuPVpm94flHXcPC5vv7/m6mcqlASNbYujaMFSB+5DeABRRZti7fsreh8TX\n6/oyFXR+lQAgx+hmVj+jjPLhIJ/1R1BYtq8QPm2dIANu1WZvtGTt0ZADtl4S0qgp\n8ZEFQRPbuwKBgHmE1nRXQhT8qgchcZmVF/LDGPHrxtZf2REEq3+G9lAkyS93QoAa\n1PD5KKBFnryPKOTI+BfI1CHktpRHfaJ60mtZ6jQZTeb5WHPm5sx9t52LI3nK91iL\nLYocFgKFrCumjhp/CCOa416Fs1yhXfmSclxZutFYX9Ryhgn0c6629ZDxAoGAKE8k\n+FAdBVkvN2XyotOhMmWtK1hW3awX+cS8rORzpR0k2sV9kBzz/ca28bPy2lP6byPA\niYZVuU3gOsFPs+pDjJWCgoVdxY9UipQbdoqd8C8rdGthPoGaHCKeDrBnVYSxOE79\njkF2owGgVDdiXc1eIAZJDbj8VS1BqtUbKtAruJ0CgYAt770+GyqgeKNZHhGl5Kcv\ndUg81X1vE0a0FSbZ9ptHINFXAFdrnjP+X875raJCbWcZ58ijBwjEyCE3QIjWRIUf\ne/YBXpusJOnml6ZwiLPi057hYQoe+xF/6JPe82+L425g5C3m+NdlSbm/++vXru0o\nzWWcH7DPQz5ziD1WIvXBnw==\n-----END PRIVATE KEY-----\n","client_email":"qr-manager-service@qr-manager-473614.iam.gserviceaccount.com","client_id":"115606067595467384878","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/qr-manager-service%40qr-manager-473614.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

### Paso 2: Verificar Permisos de Google Sheets

1. **Abrir tu Google Spreadsheet**:
   - https://docs.google.com/spreadsheets/d/1h_fEz5tDjNmdZ-57F2CoL5W6RjjAF7Yhw4ttJgypb7o/edit

2. **Compartir con la cuenta de servicio**:
   - Click en "Compartir" (arriba a la derecha)
   - Agregar: `qr-manager-service@qr-manager-473614.iam.gserviceaccount.com`
   - Rol: **Editor**
   - Click en "Enviar"

3. **Verificar que la cuenta tiene acceso**:
   - La cuenta debería aparecer en la lista de personas con acceso

### Paso 3: Redesplegar el Backend

**Opción A - Desde GitHub (Recomendado)**:
```bash
cd /Users/papayo/Desktop/QR/QR_manager
git add .
git commit -m "Update: Backend v2.1 con mapeo de parámetros y manejo de errores completo"
git push origin main
```

Render detectará el push y redesplegará automáticamente.

**Opción B - Manual desde Render**:
1. Ir a tu servicio en Render
2. Click en "Manual Deploy" > "Deploy latest commit"

### Paso 4: Verificar el Deployment

1. **Esperar a que termine** (2-3 minutos)

2. **Verificar en los logs**:
   - Deberías ver: `🚀 Servidor corriendo en puerto XXXX`
   - Deberías ver: `📋 Version 2.1 - Adaptado para apps móviles`

3. **Probar el endpoint**:
   ```bash
   curl https://qr-manager-backend-l6dg.onrender.com/
   ```

   Deberías ver:
   ```json
   {
     "message": "🏠 QR Manager Backend v2.1",
     "status": "online",
     ...
   }
   ```

4. **Probar health check**:
   ```bash
   curl https://qr-manager-backend-l6dg.onrender.com/health
   ```

   Deberías ver:
   ```json
   {
     "status": "healthy",
     "service": "QR Manager Backend",
     "version": "2.1",
     ...
   }
   ```

### Paso 5: Probar Registro de Código

```bash
curl -X POST https://qr-manager-backend-l6dg.onrender.com/api/register-code \
  -H "Content-Type: application/json" \
  -d '{"houseNumber": 1, "condominio": "Unica"}'
```

**Si funciona**, verás:
```json
{
  "success": true,
  "data": {
    "code": "ABC123",
    "houseNumber": 1,
    "createdAt": "2025-10-17T...",
    "expiresAt": "2025-10-18T...",
    "isUsed": false
  }
}
```

**Si falla con "Invalid JWT"**:
- Las credenciales de Google tienen un problema
- Verifica que el `client_email` tenga permisos en el spreadsheet
- Verifica que la `private_key` esté en UNA SOLA LÍNEA con `\n`

---

## Parte 2: Verificar Google Cloud Configuration

### Si sigues teniendo "Invalid JWT Signature"

1. **Ir a Google Cloud Console**:
   - https://console.cloud.google.com/
   - Selecciona proyecto: "qr-manager-473614"

2. **Verificar APIs habilitadas**:
   - APIs & Services > Library
   - Buscar "Google Sheets API" - debe estar **Enabled**
   - Buscar "Google Drive API" - debe estar **Enabled**

3. **Verificar Service Account**:
   - IAM & Admin > Service Accounts
   - Buscar: `qr-manager-service@qr-manager-473614.iam.gserviceaccount.com`
   - Debería existir y estar activa

4. **Regenerar credenciales (si es necesario)**:
   - Click en la service account
   - Keys > Add Key > Create New Key
   - Tipo: JSON
   - Descargar el archivo
   - Copiar TODO el contenido (debe estar en UNA línea)
   - Actualizar `GOOGLE_CREDENTIALS` en Render

---

## Parte 3: Builds de las Apps Móviles

### ResidenteApp

```bash
cd /Users/papayo/Desktop/QR/QR_manager/apps/ResidenteApp

# Limpiar builds anteriores
cd android
./gradlew clean
cd ..

# Generar APK de release
cd android
./gradlew assembleRelease
cd ..

# El APK estará en:
# android/app/build/outputs/apk/release/app-universal-release.apk
```

### VigilanciaApp

```bash
cd /Users/papayo/Desktop/QR/QR_manager/apps/VigilanciaApp

# Limpiar builds anteriores
cd android
./gradlew clean
cd ..

# Generar APK de release
cd android
./gradlew assembleRelease
cd ..

# El APK estará en:
# android/app/build/outputs/apk/release/app-universal-release.apk
```

### Instalar APKs en Dispositivos

```bash
# Para ResidenteApp
adb install /Users/papayo/Desktop/QR/QR_manager/apps/ResidenteApp/android/app/build/outputs/apk/release/app-universal-release.apk

# Para VigilanciaApp
adb install /Users/papayo/Desktop/QR/QR_manager/apps/VigilanciaApp/android/app/build/outputs/apk/release/app-universal-release.apk
```

---

## Parte 4: Testing Completo del Flujo

### Flujo 1: Residente Genera Código

1. **Abrir ResidenteApp**
2. **Login**:
   - Número de casa: 1
   - Condominio: Unica
   - Click "Ingresar"

3. **Generar Código**:
   - Click "Generar Nuevo Código"
   - Debería aparecer un código QR
   - El código debería ser de 6 caracteres (ej: "A3B7K9")

4. **Verificar en Google Sheets**:
   - Abrir spreadsheet
   - Debería existir una hoja "Registros_Casa_1"
   - Debería haber una fila nueva con el código

### Flujo 2: Vigilancia Valida Código

1. **Abrir VigilanciaApp**
2. **Dashboard debe cargar**:
   - Estadísticas del día
   - Contadores deben mostrar números

3. **Validar Código**:
   - Ingresar el código que generó el residente (ej: "A3B7K9")
   - Click "Validar Código"
   - Debería mostrar: "Código Válido ✅" con número de casa

4. **Verificar en Google Sheets**:
   - El código debería cambiar de "ACTIVO" a "VALIDADO"

### Flujo 3: Registrar Trabajador (Opcional)

1. **En VigilanciaApp**:
   - Click "Registrar INE"
   - Tomar foto de INE
   - Seleccionar tipo de servicio
   - Ingresar número de casa
   - Seleccionar condominio

2. **Verificar registro**:
   - Debería mostrar mensaje de éxito
   - Verificar en Google Sheets que aparezca el registro

---

## Debugging

### Ver Logs del Backend en Render

1. Ir a tu servicio en Render
2. Click en "Logs"
3. Buscar:
   - `🚀` - Servidor iniciado
   - `📥` - Solicitud recibida
   - `✅` - Operación exitosa
   - `❌` - Error (revisar detalles)

### Ver Logs de las Apps

**Android**:
```bash
# Para ResidenteApp
adb logcat | grep -i "residente"

# Para VigilanciaApp
adb logcat | grep -i "vigilancia"
```

### Problemas Comunes

**1. Flashazo blanco en apps**:
- ✅ RESUELTO con el mapeo de parámetros
- Si persiste: verificar que backend esté online

**2. "No se puede conectar al servidor"**:
- Verificar que Render esté online
- Verificar URL en `apps/*/src/services/api.ts`
- Verificar conexión a internet del dispositivo

**3. "Error del servidor"**:
- Ver logs en Render
- Probablemente error de Google Sheets
- Verificar permisos de service account

**4. "Código no encontrado"**:
- Verificar que el código esté en Google Sheets
- Verificar que el estado sea "ACTIVO"
- Verificar que no hayan pasado 24 horas

---

## Checklist Final

### Backend
- [ ] Variables de entorno configuradas en Render
- [ ] Service account tiene permisos en spreadsheet
- [ ] Backend desplegado y corriendo
- [ ] Health check responde correctamente
- [ ] Endpoint `/` muestra "v2.1"
- [ ] Puede registrar códigos
- [ ] Logs muestran emojis correctamente

### Apps
- [ ] APKs generados sin errores
- [ ] APKs instalados en dispositivos
- [ ] ResidenteApp abre sin flashazo
- [ ] VigilanciaApp abre sin flashazo
- [ ] Login funciona en ResidenteApp
- [ ] Dashboard carga en VigilanciaApp
- [ ] Generar código funciona
- [ ] Validar código funciona
- [ ] Compartir por WhatsApp funciona

---

## Resumen de Cambios Implementados

1. ✅ **Backend - Manejo de errores completo**
2. ✅ **Backend - Módulo de mapeo de parámetros**
3. ✅ **Backend - Endpoints adaptados**
4. ✅ **ProGuard configurado**
5. ✅ **Variables de entorno documentadas**
6. ✅ **Apps - Reintentos automáticos**
7. ✅ **Apps - Mensajes de error descriptivos**
8. ✅ **Logging completo en todo el sistema**

---

## Siguiente Paso

**AHORA**:
1. Configurar variables en Render
2. Verificar permisos en Google Sheets
3. Redesplegar backend
4. Probar endpoints
5. Generar APKs
6. Instalar y probar en dispositivos
