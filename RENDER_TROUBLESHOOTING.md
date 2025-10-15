# Guía de Troubleshooting - Render.com Deploy

## 🚨 Problemas Comunes y Soluciones

### Problema: Deploy atascado en "Preparing" con barras rojas 0%

**Síntomas:**
- Deploy muestra "Preparing..." por más de 5 minutos
- Barra de progreso roja en 0%
- No avanza a fase de "Building"

**Causas posibles:**
1. ❌ **Archivos duplicados** - Múltiples server.js confunden a Render
2. ❌ **Falta package-lock.json** - Build lento sin cache de dependencias
3. ❌ **Variables de entorno faltantes** - `GOOGLE_CREDENTIALS` no configurada
4. ❌ **Build Command incorrecta** - Render intenta compilar cuando no es necesario
5. ❌ **Root Directory incorrecto** - Render busca en carpeta equivocada

**Soluciones aplicadas en este repo:**
- ✅ Eliminado `backend/server.js` duplicado
- ✅ Agregado `backend/package-lock.json` al repo
- ✅ Actualizado `.gitignore` para permitir package-lock.json
- ✅ Estructura limpia: solo `/backend/src/server.js`

---

## 📋 Configuración Correcta en Render Dashboard

### 1. General Settings

```
Name: qr-manager-backend (o el nombre que elegiste)
Region: Oregon (us-west) o Frankfurt (más cercano a México)
Branch: main
```

### 2. Build & Deploy

**Root Directory:**
```
backend
```
*(Muy importante: Render debe buscar en la carpeta backend)*

**Build Command:**
```
npm install
```
*(Solo instalar dependencias, NO compilar)*

**Start Command:**
```
npm start
```
*(Ejecuta: node src/server.js)*

**Node Version:**
```
18
```
*(O superior, definido en package.json engines)*

### 3. Environment Variables

Click en **Environment** y agregar:

| Key | Value | Notes |
|-----|-------|-------|
| `PORT` | `10000` | Render usa puerto 10000 por defecto |
| `SHEET_ID` | `1h_fEz5tDjNmdZ-57F2CoL5W6RjjAF7Yhw4ttJgypb7o` | Tu Google Sheet ID |
| `DRIVE_FOLDER_ID` | `1STky8uJP19p1F7mfkiPrQE5jq4yOY_no` | Tu Google Drive Folder ID |
| `GOOGLE_CREDENTIALS` | `{"type":"service_account",...}` | **Secret** - JSON completo |

**IMPORTANTE para GOOGLE_CREDENTIALS:**
- Copiar TODO el JSON del archivo qr-manager-473614-f268fcc5c64e.json
- Debe ser en UNA sola línea (sin saltos de línea extra)
- Render lo detectará como texto largo
- NO usar comillas extras

---

## 🔍 Cómo Ver Logs en Render

### Durante el Deploy

1. Ir a **Render Dashboard**: https://dashboard.render.com
2. Click en tu servicio **qr-manager-backend**
3. Ir a **Logs** en el menú lateral
4. Verás logs en tiempo real:

```
==> Cloning from https://github.com/Papayo15/QR_manager...
==> Checking out commit 3bcfd703...
==> Running build command 'npm install'...
npm WARN deprecated...
added 129 packages in 12s
==> Build successful 🎉
==> Starting service...
🚀 Servidor corriendo en puerto 10000
```

### Logs de Errores Comunes

**Error 1: Module not found**
```
Error: Cannot find module './services/sheetsService'
```
**Solución:** Verificar que `backend/src/services/sheetsService.js` existe en el repo

**Error 2: Invalid credentials**
```
Error: Could not load the default credentials
```
**Solución:** Verificar que `GOOGLE_CREDENTIALS` está configurada correctamente

**Error 3: Port already in use**
```
Error: listen EADDRINUSE :::3000
```
**Solución:** Cambiar `PORT` a `10000` en variables de entorno de Render

**Error 4: Timeout**
```
Error: Your service didn't respond to HTTP requests in time
```
**Solución:** Verificar que `app.listen(PORT)` usa `process.env.PORT`

---

## ✅ Checklist de Verificación

Antes de hacer deploy, verificar:

### En el Repositorio GitHub
- [ ] Solo existe `backend/src/server.js` (NO `backend/server.js`)
- [ ] Existe `backend/package-lock.json` en el repo
- [ ] `backend/package.json` tiene `"start": "node src/server.js"`
- [ ] `backend/package.json` tiene `"engines": {"node": ">=18.0.0"}`
- [ ] Último commit pushed a GitHub

### En Render Dashboard
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Variable `PORT` = `10000`
- [ ] Variable `SHEET_ID` configurada
- [ ] Variable `DRIVE_FOLDER_ID` configurada
- [ ] Variable `GOOGLE_CREDENTIALS` configurada (JSON completo)
- [ ] Auto-Deploy: ON (Deploy automático desde GitHub)

### Después del Deploy
- [ ] Status del servicio: **Live** (verde)
- [ ] Logs muestran: `🚀 Servidor corriendo en puerto...`
- [ ] URL responde: `https://tu-servicio.onrender.com/health`
- [ ] Health check retorna JSON con status "healthy"

---

## 🔄 Cómo Forzar Redeploy

Si el deploy falla, puedes forzar un redeploy:

### Opción 1: Manual Deploy
1. Ir a Render Dashboard
2. Click en tu servicio
3. Click en **Manual Deploy** (botón arriba a la derecha)
4. Seleccionar branch `main`
5. Click **Deploy**

### Opción 2: Clear Build Cache
1. En Render Dashboard → tu servicio
2. Settings → Danger Zone
3. Click **Clear build cache & deploy**
4. Confirmar

### Opción 3: Desde Git
```bash
# Hacer cambio mínimo
git commit --allow-empty -m "Trigger Render redeploy"
git push
```

---

## 📊 Tiempos Normales de Deploy

**Deploy exitoso típico:**
```
⏱️ Preparing: 10-30 segundos
⏱️ Building: 30-90 segundos
⏱️ Starting: 10-20 segundos
✅ Total: 1-3 minutos
```

**Si toma más de 5 minutos en "Preparing":**
- ❌ Algo está mal
- Revisar logs para ver error
- Verificar configuración
- Intentar redeploy manual

---

## 🧪 Probar Backend Después de Deploy

### 1. Test desde Navegador

**Health check:**
```
https://qrvisitas.onrender.com/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "service": "QR Manager Backend",
  "version": "2.0",
  "timestamp": "2025-10-15T...",
  "uptime": "120 seconds",
  "memory": {
    "used": "45 MB",
    "total": "512 MB"
  }
}
```

**Endpoint raíz:**
```
https://qrvisitas.onrender.com/
```

**Respuesta esperada:**
```json
{
  "message": "🏠 QR Manager Backend v2.0",
  "status": "online",
  "platform": "Render.com",
  "keepAlive": "UptimeRobot monitoring /health",
  "endpoints": [...]
}
```

### 2. Test desde Terminal

```bash
# Health check
curl https://qrvisitas.onrender.com/health

# Endpoint raíz
curl https://qrvisitas.onrender.com/

# Con formato bonito
curl -s https://qrvisitas.onrender.com/health | jq
```

### 3. Test desde Apps Móviles

Abrir **ResidenteApp** o **VigilanciaApp**:
- Debe conectar en ~2-5 segundos (con UptimeRobot)
- Primera vez puede tardar ~30s (si Render está dormido)
- Ver logs en Metro bundler para debug

---

## 🆘 Contacto de Soporte

**Render Status:**
https://status.render.com

**Render Community:**
https://community.render.com

**Documentación Render:**
https://render.com/docs

**GitHub Issues de este proyecto:**
https://github.com/Papayo15/QR_manager/issues

---

## 📝 Notas Adicionales

### Free Tier Limits
- **750 horas/mes** = ~31 días de uptime
- **512 MB RAM**
- **Se duerme** después de 15 min sin tráfico
- **Solución:** UptimeRobot hace ping cada 5 min (ver UPTIMEROBOT_SETUP.md)

### Cold Start
- **Sin UptimeRobot:** 30-90 segundos primera petición
- **Con UptimeRobot:** 2-5 segundos siempre

### Monitoreo
- Ver uso de horas: Render Dashboard → Account → Usage
- Ver uptime: UptimeRobot Dashboard
- Ver logs en vivo: Render Dashboard → Logs

---

**Última actualización:** Octubre 2025
