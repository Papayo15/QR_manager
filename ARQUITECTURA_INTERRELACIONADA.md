# Arquitectura Interrelacionada del Sistema
## Cómo Funcionan Todos los Componentes Juntos

---

## Vista General del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GOOGLE CLOUD                                 │
│  ┌──────────────────────┐         ┌──────────────────────────┐     │
│  │  Google Sheets API   │         │   Service Account        │     │
│  │  Spreadsheet ID:     │◄────────┤   qr-manager-service@... │     │
│  │  1h_fEz5tDjNmdZ...   │         │   (Credenciales JWT)     │     │
│  └──────────────────────┘         └──────────────────────────┘     │
└────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS API Calls
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                   BACKEND (Render.com)                              │
│                   Node.js + Express                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  server.js (v2.1)                                            │  │
│  │  - Recibe requests de apps                                   │  │
│  │  - Usa paramMapper para convertir parámetros                 │  │
│  │  - Llama a sheetsService para operaciones                    │  │
│  │  - Retorna respuestas en formato esperado por apps           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ▲                                      │
│                              │                                      │
│  ┌──────────────────────────┴───────────────────────────────────┐  │
│  │  utils/paramMapper.js                                        │  │
│  │  - mapAppParamsToBackend()                                   │  │
│  │  - generateQRCode()                                          │  │
│  │  - getCurrentDateTime()                                      │  │
│  │  - getSpreadsheetId()                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ▲                                      │
│                              │                                      │
│  ┌──────────────────────────┴───────────────────────────────────┐  │
│  │  services/sheetsService.js                                   │  │
│  │  - registerCode()                                            │  │
│  │  - validateCode()                                            │  │
│  │  - registerWorker()                                          │  │
│  │  - getHistory()                                              │  │
│  │  - getCounters()                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS Requests
                              │ (JSON over HTTP)
                ┌─────────────┴──────────────┐
                │                            │
┌───────────────▼────────┐    ┌──────────────▼──────────┐
│   ResidenteApp         │    │   VigilanciaApp          │
│   (React Native)       │    │   (React Native)         │
│                        │    │                          │
│  ┌──────────────────┐  │    │  ┌──────────────────┐   │
│  │  LoginScreen     │  │    │  │  DashboardScreen │   │
│  │  - Casa: 25      │  │    │  │  - Contadores    │   │
│  │  - Condo: Unica  │  │    │  │  - Validar QR    │   │
│  └──────────────────┘  │    │  └──────────────────┘   │
│          │             │    │          │              │
│          ▼             │    │          ▼              │
│  ┌──────────────────┐  │    │  ┌──────────────────┐   │
│  │  HomeScreen      │  │    │  │ RegisterWorker   │   │
│  │  - Generar QR    │  │    │  │  - Foto INE      │   │
│  │  - Compartir     │  │    │  │  - Tipo servicio │   │
│  │  - Historial     │  │    │  └──────────────────┘   │
│  └──────────────────┘  │    │                         │
│          │             │    │                         │
│          ▼             │    │          ▼              │
│  ┌──────────────────┐  │    │  ┌──────────────────┐   │
│  │  api.ts          │  │    │  │  api.ts          │   │
│  │  - healthCheck() │  │    │  │  - healthCheck() │   │
│  │  - registerCode()│  │    │  │  - validateQR()  │   │
│  │  - getHistory()  │  │    │  │  - getCounters() │   │
│  │  - Reintentos 3x │  │    │  │  - registerWorker│   │
│  │  - Timeout 20s   │  │    │  │  - Reintentos 3x │   │
│  └──────────────────┘  │    │  └──────────────────┘   │
└────────────────────────┘    └─────────────────────────┘
```

---

## Flujo 1: Residente Genera Código QR

### Paso a Paso Detallado

```
1. USUARIO EN ResidenteApp
   │
   ├─► LoginScreen.tsx:50
   │   - Usuario ingresa: Casa 25, Condominio "Unica"
   │   - Guarda en AsyncStorage
   │   - Navega a HomeScreen
   │
   └─► HomeScreen.tsx:60
       - Usuario click "Generar Nuevo Código"
       - Llama: generateQRCode()

2. API CALL
   │
   ├─► api.ts:111 (ResidenteApp)
   │   registerCode({ houseNumber: 25, condominio: "Unica" })
   │   │
   │   ├─► fetchWithRetry() - Intenta hasta 3 veces
   │   │   - Timeout: 20 segundos
   │   │   - URL: https://qr-manager-backend-l6dg.onrender.com/api/register-code
   │   │   - Body: {"houseNumber": 25, "condominio": "Unica"}
   │   │
   │   └─► Espera respuesta...

3. BACKEND RECIBE
   │
   ├─► server.js:49 (Backend)
   │   POST /api/register-code
   │   │
   │   ├─► console.log('📥 Solicitud de registro de código:', req.body)
   │   │   Output: { houseNumber: 25, condominio: 'Unica' }
   │   │
   │   └─► paramMapper.mapAppParamsToBackend(req.body)
   │
   ├─► paramMapper.js:44
   │   mapAppParamsToBackend({ houseNumber: 25, condominio: "Unica" })
   │   │
   │   ├─► getSpreadsheetId()
   │   │   Returns: "1h_fEz5tDjNmdZ-57F2CoL5W6RjjAF7Yhw4ttJgypb7o"
   │   │
   │   ├─► getSheetName(25, "Unica")
   │   │   Returns: "Registros_Casa_25"
   │   │
   │   └─► console.log('🔄 Mapeando: Casa 25 (Unica) → Registros_Casa_25')
   │       Returns: {
   │         sheetId: "1h_fEz5tDjNmdZ...",
   │         sheetName: "Registros_Casa_25",
   │         casa: "25",
   │         condominio: "Unica"
   │       }
   │
   ├─► server.js:57
   │   generateQRCode()
   │   │
   │   └─► paramMapper.js:78
   │       Returns: "A3B7K9" (código aleatorio de 6 caracteres)
   │
   ├─► server.js:58
   │   getCurrentDateTime()
   │   │
   │   └─► paramMapper.js:88
   │       Returns: {
   │         fecha: "17/10/2025",
   │         hora: "12:34",
   │         mes: "octubre",
   │         año: "2025"
   │       }
   │
   └─► server.js:74
       sheetsService.registerCode({
         sheetId: "1h_fEz5tDjNmdZ...",
         sheetName: "Registros_Casa_25",
         codigo: "A3B7K9",
         visitante: "Visitante",
         residente: "Casa 25",
         casa: "25",
         fecha: "17/10/2025",
         hora: "12:34",
         mes: "octubre",
         año: "2025"
       })

4. SHEETS SERVICE
   │
   ├─► sheetsService.js:37
   │   registerCode(data)
   │   │
   │   ├─► console.log('📝 Registrando código: A3B7K9 para casa 25')
   │   │
   │   ├─► Validación (línea 42)
   │   │   if (!sheetId || !sheetName || !codigo)
   │   │   ✅ Todo presente
   │   │
   │   ├─► ensureSheetExists(sheetId, sheetName)
   │   │   │
   │   │   └─► sheetsService.js:4
   │   │       - Conecta con Google Sheets API
   │   │       - Verifica si existe "Registros_Casa_25"
   │   │       - Si NO existe, la crea con headers
   │   │       - console.log('✅ Hoja Registros_Casa_25 creada/verificada')
   │   │
   │   ├─► getSheetsClient() (línea 49)
   │   │   - Obtiene cliente autenticado con Google
   │   │
   │   ├─► sheets.spreadsheets.values.append() (línea 52)
   │   │   - Agrega fila a Google Sheets:
   │   │     [
   │   │       "2025-10-17T12:34:56.789Z",  // Timestamp
   │   │       "CODIGO_QR",                 // Tipo
   │   │       "A3B7K9",                    // Código
   │   │       "Visitante",                 // Visitante
   │   │       "Casa 25",                   // Residente
   │   │       "25",                        // Casa
   │   │       "17/10/2025",               // Fecha
   │   │       "12:34",                    // Hora
   │   │       "ACTIVO",                   // Resultado
   │   │       "",                         // TipoServicio
   │   │       "",                         // FotoURL
   │   │       "octubre",                  // Mes
   │   │       "2025"                      // Año
   │   │     ]
   │   │
   │   ├─► console.log('✅ Código A3B7K9 registrado exitosamente')
   │   │
   │   └─► Returns: { success: true, codigo: "A3B7K9", sheetName: "Registros_Casa_25" }

5. BACKEND RESPONDE
   │
   └─► server.js:81
       Responde a la app:
       {
         success: true,
         data: {
           code: "A3B7K9",
           houseNumber: 25,
           createdAt: "2025-10-17T12:34:56.789Z",
           expiresAt: "2025-10-18T12:34:56.789Z",  // +24 horas
           isUsed: false
         }
       }

6. APP RECIBE RESPUESTA
   │
   ├─► api.ts:128 (ResidenteApp)
   │   console.log('Código registrado exitosamente:', result)
   │   │
   │   └─► Returns: { success: true, data: {...} }
   │
   └─► HomeScreen.tsx:70
       - Actualiza estado: setCurrentCode(response.data)
       - Muestra QR code en pantalla
       - Actualiza historial
       - Alert.alert('Éxito', 'Código QR generado correctamente')

USUARIO VE:
   ┌─────────────────────┐
   │   Código QR         │
   │   ┌───────────┐     │
   │   │  QR CODE  │     │
   │   │  A3B7K9   │     │
   │   └───────────┘     │
   │                     │
   │ Expira: 18/10/2025  │
   │      12:34          │
   │                     │
   │ [Compartir]         │
   └─────────────────────┘
```

---

## Flujo 2: Vigilancia Valida Código

### Paso a Paso Detallado

```
1. USUARIO EN VigilanciaApp
   │
   └─► DashboardScreen.tsx:56
       - Usuario ingresa código: "A3B7K9"
       - Click "Validar Código"
       - Llama: validateCode()

2. API CALL
   │
   ├─► api.ts:119 (VigilanciaApp)
   │   validateQR({ code: "A3B7K9" })
   │   │
   │   ├─► console.log('Validando código QR:', { code: "A3B7K9" })
   │   │
   │   ├─► fetchWithRetry()
   │   │   - URL: https://qr-manager-backend-l6dg.onrender.com/api/validate-qr
   │   │   - Body: {"code": "A3B7K9"}
   │   │
   │   └─► Espera respuesta...

3. BACKEND RECIBE
   │
   ├─► server.js:98
   │   POST /api/validate-qr
   │   │
   │   ├─► console.log('📥 Solicitud de validación de código:', req.body)
   │   │   Output: { code: 'A3B7K9' }
   │   │
   │   ├─► Validación (línea 104)
   │   │   if (!code) return error
   │   │   ✅ Código presente
   │   │
   │   ├─► getSpreadsheetId() (línea 109)
   │   │   Returns: "1h_fEz5tDjNmdZ..."
   │   │
   │   └─► sheetsService.validateCode(spreadsheetId, "A3B7K9")

4. SHEETS SERVICE BUSCA
   │
   ├─► sheetsService.js:97
   │   validateCode("1h_fEz5tDjNmdZ...", "A3B7K9")
   │   │
   │   ├─► console.log('🔍 Validando código: A3B7K9')
   │   │
   │   ├─► Validación (línea 100)
   │   │   if (!spreadsheetId || !codigo)
   │   │   ✅ Todo presente
   │   │
   │   ├─► getSheetsClient() (línea 105)
   │   │   - Conecta con Google Sheets
   │   │
   │   ├─► sheets.spreadsheets.get({ spreadsheetId }) (línea 106)
   │   │   - Obtiene lista de todas las hojas
   │   │   Returns: {
   │   │     sheets: [
   │   │       { properties: { title: "Registros_Casa_1" } },
   │   │       { properties: { title: "Registros_Casa_25" } },
   │   │       { properties: { title: "Registros_Casa_50" } },
   │   │       ...
   │   │     ]
   │   │   }
   │   │
   │   ├─► FOR EACH SHEET (línea 108)
   │   │   │
   │   │   ├─► sheetName = "Registros_Casa_1"
   │   │   │   - if (!sheetName.startsWith('Registros_Casa_'))
   │   │   │   - ❌ Continue
   │   │   │
   │   │   ├─► sheetName = "Registros_Casa_25"
   │   │   │   - if (!sheetName.startsWith('Registros_Casa_'))
   │   │   │   - ✅ Continua
   │   │   │   │
   │   │   │   ├─► sheets.spreadsheets.values.get() (línea 112)
   │   │   │   │   range: "Registros_Casa_25!A:M"
   │   │   │   │   Returns: {
   │   │   │   │     values: [
   │   │   │   │       ["Timestamp", "Tipo", "Código", ...],  // Headers
   │   │   │   │       ["2025-10-17T12:34:56Z", "CODIGO_QR", "A3B7K9", ...]
   │   │   │   │     ]
   │   │   │   │   }
   │   │   │   │
   │   │   │   ├─► FOR EACH ROW (línea 118)
   │   │   │   │   │
   │   │   │   │   ├─► row[2] === "A3B7K9" ✅
   │   │   │   │   ├─► row[8] === "ACTIVO" ✅
   │   │   │   │   │
   │   │   │   │   ├─► Verificar expiración (línea 121)
   │   │   │   │   │   created = new Date(row[0])
   │   │   │   │   │   hours = (now - created) / 3600000
   │   │   │   │   │   │
   │   │   │   │   │   ├─► if (hours > 24)
   │   │   │   │   │   │   - ❌ Solo han pasado 2 horas
   │   │   │   │   │   │   - Código NO expirado
   │   │   │   │   │   │
   │   │   │   │   │   └─► ✅ Código válido!
   │   │   │   │   │
   │   │   │   │   ├─► updateStatus(..., 'VALIDADO') (línea 130)
   │   │   │   │   │   │
   │   │   │   │   │   └─► sheetsService.js:145
   │   │   │   │   │       - sheets.spreadsheets.values.update()
   │   │   │   │   │       - range: "Registros_Casa_25!I2"
   │   │   │   │   │       - value: "VALIDADO"
   │   │   │   │   │       - console.log('🔄 Estado actualizado a VALIDADO')
   │   │   │   │   │
   │   │   │   │   ├─► console.log('✅ Código A3B7K9 validado para casa 25')
   │   │   │   │   │
   │   │   │   │   └─► Returns: {
   │   │   │   │         status: 'VALIDADO',
   │   │   │   │         nombre: 'Visitante',
   │   │   │   │         casa: '25'
   │   │   │   │       }
   │   │   │   │
   │   │   │   └─► BREAK - Código encontrado!
   │   │   │
   │   │   └─► ... (otras hojas)

5. BACKEND RESPONDE
   │
   └─► server.js:115
       valid = (result.status === 'VALIDADO')
       Responde:
       {
         success: true,
         data: {
           valid: true,
           message: "Acceso permitido: Visitante",
           houseNumber: 25,
           expiresAt: "2025-10-18T12:34:56.789Z"
         }
       }

6. APP RECIBE RESPUESTA
   │
   ├─► api.ts:137 (VigilanciaApp)
   │   console.log('Código validado:', result)
   │   Returns: { success: true, data: {...} }
   │
   └─► DashboardScreen.tsx:66
       - if (response.data.valid)
       - Alert.alert(
           'Código Válido ✅',
           'Casa: 25\nAcceso permitido: Visitante'
         )
       - setQrCode('')
       - loadCounters()  // Actualiza estadísticas

USUARIO VE:
   ┌─────────────────────┐
   │  Código Válido ✅   │
   │                     │
   │  Casa: 25           │
   │  Acceso permitido:  │
   │  Visitante          │
   │                     │
   │      [OK]           │
   └─────────────────────┘

GOOGLE SHEETS AHORA TIENE:
   Registros_Casa_25:
   ┌────────────┬────────┬────────┬──────────┬─────────┬──────┬──────────┐
   │ Timestamp  │ Tipo   │ Código │ Visitante│ Resultado│ ...  │          │
   ├────────────┼────────┼────────┼──────────┼─────────┼──────┼──────────┤
   │ 2025-10... │CODIGO_QR│A3B7K9 │ Visitante│ VALIDADO│ ...  │          │
   └────────────┴────────┴────────┴──────────┴─────────┴──────┴──────────┘
```

---

## Puntos Clave de Interrelación

### 1. Mapeo de Parámetros (CRÍTICO)

```javascript
// App envía:
{
  "houseNumber": 25,
  "condominio": "Unica"
}

// paramMapper convierte a:
{
  "sheetId": "1h_fEz5tDjNmdZ...",      // Desde .env
  "sheetName": "Registros_Casa_25",    // Generado
  "casa": "25"                          // Convertido a string
}

// sheetsService usa para:
- Buscar/crear hoja específica
- Escribir en la hoja correcta
- Leer de la hoja correcta
```

### 2. Try-Catch en Cascada

```
api.ts (App)
  └─► try-catch con reintentos
      └─► server.js (Backend)
          └─► try-catch con logging
              └─► paramMapper.js
                  └─► try-catch con validación
                      └─► sheetsService.js
                          └─► try-catch con Google API
```

**Beneficio**: Si falla en cualquier nivel, se captura y reporta correctamente

### 3. Logging Interconectado

```
📥 App envía request
  └─► 🔄 Backend mapea parámetros
      └─► 📝 SheetsService registra operación
          └─► ✅ Google Sheets confirma
              └─► ✅ Backend responde éxito
                  └─► ✅ App muestra resultado
```

---

## Diagrama de Estado del Código QR

```
[GENERADO]
    │
    │ ResidenteApp.generateQRCode()
    ├─► Backend.registerCode()
    ├─► SheetsService crea fila
    └─► Estado: "ACTIVO"

[ACTIVO]
    │
    ├─► VigilanciaApp.validateQR() ────► [VALIDADO]
    │                                          │
    │                                          └─► Fin del flujo
    │
    └─► Si pasan 24 horas ──────────────► [EXPIRADO]
                                               │
                                               └─► No se puede usar
```

---

## Resumen de Flujos Completos

### Flujo A: Generar → Validar (Exitoso)

```
ResidenteApp → Backend → Google Sheets → Backend → ResidenteApp
(Casa 25)      (Mapea)  (Guarda ACTIVO) (Responde) (Muestra QR)
                                ↓
                         Código: A3B7K9
                         Estado: ACTIVO
                                ↓
VigilanciaApp → Backend → Google Sheets → Backend → VigilanciaApp
(Ingresa A3B7K9) (Busca) (Encuentra + Update) (Valida) (Muestra ✅)
                                ↓
                         Código: A3B7K9
                         Estado: VALIDADO
```

### Flujo B: Código Expirado

```
ResidenteApp genera → 24 horas pasan → VigilanciaApp intenta validar
                                              ↓
                                       Backend verifica tiempo
                                              ↓
                                       hours > 24 = true
                                              ↓
                                       updateStatus('EXPIRADO')
                                              ↓
                                       Responde: DENEGADO
```

### Flujo C: Código No Encontrado

```
VigilanciaApp → Backend → Google Sheets
(Ingresa XYZ123)  (Busca)  (Recorre todas las hojas)
                              ↓
                      No encuentra coincidencia
                              ↓
                      Responde: DENEGADO
```

---

## Archivos Clave y Su Rol

| Archivo | Rol | Se Comunica Con |
|---------|-----|-----------------|
| `apps/*/src/services/api.ts` | Cliente HTTP con reintentos | Backend endpoints |
| `backend/src/server.js` | Orchestrator principal | paramMapper, sheetsService |
| `backend/src/utils/paramMapper.js` | Traductor de formatos | .env, server.js |
| `backend/src/services/sheetsService.js` | Interfaz con Google | Google Sheets API |
| `backend/src/config/googleConfig.js` | Autenticación Google | GOOGLE_CREDENTIALS env |
| `apps/*/android/app/proguard-rules.pro` | Protección de código | Build system |

---

Este sistema está completamente interrelacionado donde cada componente depende del otro para funcionar correctamente. El mapeo de parámetros es el **pegamento crítico** que permite que las apps y el backend se comuniquen sin necesidad de modificar las apps.
