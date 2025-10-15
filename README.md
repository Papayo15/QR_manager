# QR Manager - Sistema de Gestión de Visitas para Condominios

Sistema completo de gestión de códigos QR para control de acceso en condominios, con dos aplicaciones móviles (Residente y Vigilancia) y backend en Node.js.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐         ┌─────────────────┐
│  ResidenteApp   │         │  VigilanciaApp  │
│   (React Native)│         │  (React Native) │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Backend (Node.js)   │
         │   Render.com + GRATIS │
         │   UptimeRobot (ping)  │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌────────────────┐    ┌──────────────────┐
│ Google Sheets  │    │  Google Drive    │
│ (Base de datos)│    │  (Fotos INE)     │
└────────────────┘    └──────────────────┘
```

## 📱 Aplicaciones

### 1. ResidenteApp (En desarrollo)
**Funcionalidades planeadas:**
- Login por casa (1-100)
- Generar códigos QR alfanuméricos de 6 dígitos
- Vigencia de 24 horas
- Compartir código por WhatsApp
- Ver historial de últimos 5 códigos generados
- Datos almacenados en Google Sheets por mes/día/casa

### 2. VigilanciaApp (En desarrollo)
**Funcionalidades planeadas:**
- Validar códigos QR escaneados
- Dashboard con contadores diarios:
  - Códigos generados
  - Códigos validados
  - Códigos negados
- Sección de registro de INE:
  - Captura de foto de identificación
  - Registro de casa a visitar
  - Tipo de trabajador (sirvienta, jardinero, repartidor, etc.)
  - Almacenamiento de fotos en Google Drive

### 3. Backend (Node.js + Express)
**Estado:** ✅ Funcionando en Render.com (GRATIS)

**Endpoints implementados:**
- `GET /health` - Health check (monitoreado por UptimeRobot)
- `GET /` - Información del servidor
- `POST /api/register-code` - Registrar nuevo código QR
- `POST /api/validate-qr` - Validar código QR
- `POST /api/register-worker` - Registrar trabajador con INE
- `GET /api/get-history` - Obtener historial de códigos
- `GET /api/counters` - Obtener contadores del día

**URL:** https://qrvisitas.onrender.com

## 🚀 Configuración del Proyecto

### Requisitos Previos
- Node.js >= 18.0.0
- npm o yarn
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS, solo en macOS)

### Backend

1. **Instalar dependencias:**
   ```bash
   cd backend
   npm install
   ```

2. **Configurar variables de entorno:**
   Crear archivo `.env` basado en `.env.example`:
   ```env
   PORT=3000
   SHEET_ID=1h_fEz5tDjNmdZ-57F2CoL5W6RjjAF7Yhw4ttJgypb7o
   DRIVE_FOLDER_ID=1STky8uJP19p1F7mfkiPrQE5jq4yOY_no
   GOOGLE_CREDENTIALS={"type":"service_account",...}
   ```

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

4. **Ejecutar en producción:**
   ```bash
   npm start
   ```

### Apps Móviles

#### ResidenteApp

```bash
cd apps/ResidenteApp
npm install

# Android
npm run android

# iOS (solo macOS)
cd ios && pod install && cd ..
npm run ios
```

#### VigilanciaApp

```bash
cd apps/VigilanciaApp
npm install

# Android
npm run android

# iOS (solo macOS)
cd ios && pod install && cd ..
npm run ios
```

## 🌐 Hosting y Servicios

### Backend - Render.com (GRATIS ✅)
- **Plan:** Free tier (750 horas/mes)
- **RAM:** 512MB
- **Problema:** Se duerme después de 15 min de inactividad
- **Solución:** UptimeRobot hace ping cada 5 minutos

### Keep-Alive - UptimeRobot (GRATIS ✅)
- **Servicio:** Monitoreo gratuito
- **Frecuencia:** Ping cada 5 minutos a `/health`
- **Resultado:** Backend siempre activo, sin cold starts

**📖 Ver guía completa:** [UPTIMEROBOT_SETUP.md](UPTIMEROBOT_SETUP.md)

### Google Services
- **Sheets:** Base de datos de códigos QR
- **Drive:** Almacenamiento de fotos INE
- **Service Account:** `qr-manager-service@qr-manager-473614.iam.gserviceaccount.com`

## 🏘️ Condominios Soportados

Actualmente configurados:
1. Unica
2. Bocamar
3. Zebrina
4. Nuva
5. Aposento

*Nota: Se pueden agregar más condominios según sea necesario*

## 📊 Estructura de Datos

### Google Sheets
```
Condominio/
├── Mes (Enero, Febrero, ...)
│   ├── Día (2025-10-15)
│   │   ├── Casa 1
│   │   ├── Casa 2
│   │   └── ...
│   └── ...
└── ...
```

### Google Drive
```
Drive Folder/
├── INE_Photos/
│   ├── 2025-10/
│   │   ├── casa1_20251015_123456.jpg
│   │   ├── casa2_20251015_234567.jpg
│   │   └── ...
│   └── ...
└── ...
```

## 🔧 Scripts Disponibles

### Raíz del proyecto
```bash
npm run android-residente    # Ejecutar ResidenteApp en Android
npm run android-vigilancia   # Ejecutar VigilanciaApp en Android
npm run start-residente      # Metro bundler para ResidenteApp
npm run start-vigilancia     # Metro bundler para VigilanciaApp
```

### Backend
```bash
npm start    # Producción
npm run dev  # Desarrollo con nodemon
```

## 📦 Tecnologías Utilizadas

### Frontend (Apps Móviles)
- React Native 0.76.5
- TypeScript 5.6.3
- React 18.3.1
- react-native-qrcode-svg (generación de QR)
- react-native-image-picker (captura de fotos)
- @react-native-async-storage/async-storage (almacenamiento local)

### Backend
- Node.js >= 18.0.0
- Express 4.18.2
- Google APIs (googleapis 128.0.0)
- CORS 2.8.5
- dotenv 16.3.1

### Hosting (100% GRATIS)
- Render.com (backend)
- UptimeRobot (keep-alive)
- Google Sheets (base de datos)
- Google Drive (almacenamiento)

## 🔐 Seguridad

- Variables de entorno para credenciales sensibles
- `.gitignore` configurado para no subir credenciales
- Service Account con permisos limitados
- CORS configurado en el backend
- Validación de códigos QR con vigencia de 24 horas

## 📱 Compilación de APKs

Los APKs compilados se guardan en `/apks`:

```bash
# Compilar ResidenteApp
cd apps/ResidenteApp/android
./gradlew assembleRelease

# Compilar VigilanciaApp
cd apps/VigilanciaApp/android
./gradlew assembleRelease
```

APKs generados:
- `/apks/ResidenteApp_YYYYMMDD_HHMMSS.apk`
- `/apks/VigilanciaApp_YYYYMMDD_HHMMSS.apk`

## 🐛 Troubleshooting

### Backend no responde
1. Verificar que Render esté activo: https://dashboard.render.com
2. Verificar UptimeRobot esté monitoreando: https://uptimerobot.com/dashboard
3. Revisar logs en Render dashboard

### Apps no conectan al backend
1. Verificar URL en `App.tsx`: `https://qrvisitas.onrender.com`
2. Verificar que `/health` responda: abrir en navegador
3. Revisar timeouts (actualmente 15 segundos)

### Compilación de Android falla
1. Limpiar caché:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```
2. Reinstalar dependencias:
   ```bash
   rm -rf node_modules
   npm install
   ```

## 📖 Documentación Adicional

- [Configuración de UptimeRobot](UPTIMEROBOT_SETUP.md) - Cómo mantener Render activo 24/7

## 🤝 Contribución

Este es un proyecto privado. Para hacer cambios:

1. Crear una rama nueva
2. Hacer los cambios
3. Hacer commit con mensaje descriptivo
4. Hacer push y crear pull request

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

## 👤 Contacto

Repositorio: https://github.com/Papayo15/QR_manager

---

**Estado del Proyecto:** 🚧 En desarrollo

**Última actualización:** Octubre 2025
