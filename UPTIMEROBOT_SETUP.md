# Guía de Configuración UptimeRobot para Render

## 🎯 Objetivo
Mantener el backend de Render.com siempre despierto usando UptimeRobot (servicio gratuito de monitoreo) para evitar cold starts de 30-90 segundos.

## ✅ Ventajas de esta Solución
- **100% GRATIS** - UptimeRobot y Render son gratis para siempre
- **Siempre activo** - Backend nunca se duerme
- **Respuesta rápida** - 2-5 segundos en lugar de 30-90 segundos
- **Fácil configuración** - Solo 2-3 minutos
- **Sin código extra** - Ya tenemos endpoint `/health` listo
- **750 horas/mes** en Render = suficiente para uso 24/7

## 📋 Paso a Paso

### 1. Crear cuenta en UptimeRobot

1. Ir a **https://uptimerobot.com**
2. Click en **Sign Up Free**
3. Completar formulario:
   - Email (tu correo)
   - Password
   - Confirmar que no eres robot
4. Click **Sign Up**
5. Verificar email (revisa tu correo)
6. Click en el link de confirmación
7. ✅ No requiere tarjeta de crédito

### 2. Configurar Monitor para tu Backend

Una vez dentro del dashboard:

1. Click en **+ Add New Monitor**

2. Configurar monitor:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: QR Manager Backend (Render)
   URL (or IP): https://qrvisitas.onrender.com/health
   Monitoring Interval: Every 5 minutes
   ```

3. **Dejar configuración avanzada como está:**
   - Monitor Timeout: 30 seconds
   - Request Method: GET (HEAD)
   - Alert Contacts: Tu email (opcional)

4. Click **Create Monitor**

5. ✅ Listo! UptimeRobot comenzará a hacer ping cada 5 minutos

### 3. Verificar que Funciona

**Opción A: Dashboard UptimeRobot**
- Ir a tu dashboard en https://uptimerobot.com/dashboard
- Deberías ver el monitor con estado **Up** (verde)
- Uptime: debería mostrar 100% después de unas horas

**Opción B: Desde navegador**
- Abrir https://qrvisitas.onrender.com/health
- Deberías ver respuesta JSON instantánea:
  ```json
  {
    "status": "healthy",
    "service": "QR Manager Backend",
    "version": "2.0",
    "timestamp": "2025-10-15T...",
    "uptime": "3600 seconds",
    "memory": {
      "used": "45 MB",
      "total": "512 MB"
    }
  }
  ```

**Opción C: Desde las apps móviles**
- Abrir ResidenteApp o VigilanciaApp
- Debería conectar en ~2-5 segundos (no 90 segundos)

### 4. Configuración Adicional (Opcional)

#### Alertas por Email
Si quieres recibir alertas cuando el backend esté caído:

1. En UptimeRobot dashboard → **My Settings**
2. **Alert Contacts** → Verificar tu email
3. Editar tu monitor → **Alert Contacts to Notify** → Seleccionar tu email
4. Guardar

Recibirás email si:
- Backend está caído por >2 minutos
- Backend vuelve a estar operativo

#### Múltiples Monitores
Con la cuenta gratuita puedes tener hasta **50 monitores**, útil si tienes:
- Múltiples backends
- Frontend en Vercel/Netlify
- Base de datos

## 📊 Consumo de Horas en Render

**Cálculo:**
- UptimeRobot hace ping cada 5 minutos
- En 1 hora = 12 pings
- Cada ping mantiene Render activo por ~15 minutos
- Resultado: **Backend activo 24/7**

**Consumo mensual:**
- Render free tier: 750 horas/mes
- Días en el mes: ~30 días = 720 horas
- ✅ **Suficiente para estar activo todo el mes**

## 🔧 Troubleshooting

### Problema: Monitor muestra "Down"
**Causas posibles:**
1. Render está inactivo por horas gratuitas agotadas
2. URL incorrecta en UptimeRobot
3. Backend tiene error

**Solución:**
1. Verificar que Render esté activo: https://dashboard.render.com
2. Revisar logs en Render
3. Verificar URL en UptimeRobot: debe ser `https://qrvisitas.onrender.com/health`

### Problema: Sigo viendo timeouts largos en las apps
**Causas posibles:**
1. UptimeRobot no está configurado aún
2. Monitor está pausado
3. Intervalo muy largo (>5 minutos)

**Solución:**
1. Verificar que monitor esté **activo** en UptimeRobot
2. Cambiar intervalo a 5 minutos
3. Esperar ~10 minutos para que tome efecto

### Problema: Render se queda sin horas gratuitas
**Causas posibles:**
1. Tienes múltiples servicios en Render
2. Mes con 31 días (necesitas 744 horas)

**Solución:**
1. Revisar dashboard Render: cuántas horas usas
2. Si tienes múltiples servicios, considera:
   - Migrar servicios menos críticos
   - Usar Railway ($5/mes crédito gratis)
   - Usar Vercel para frontends

## 📱 Actualizar Timeouts en Apps (Opcional)

Como ahora el backend siempre está despierto, puedes reducir los timeouts:

**apps/ResidenteApp/App.tsx** y **apps/VigilanciaApp/App.tsx**:

```typescript
// Antes (con Render durmiendo)
const TIMEOUTS = {
  FIRST_ATTEMPT: 90000,   // 90s
  SECOND_ATTEMPT: 45000,  // 45s
  THIRD_ATTEMPT: 30000    // 30s
};

// Después (con UptimeRobot activo)
const TIMEOUTS = {
  FIRST_ATTEMPT: 15000,   // 15s
  SECOND_ATTEMPT: 15000,  // 15s
  THIRD_ATTEMPT: 15000    // 15s
};
```

Esto mejora la experiencia del usuario con respuestas más rápidas.

## 🎉 Resultado Final

**Antes (sin UptimeRobot):**
- ❌ Primera petición: 30-90 segundos
- ❌ Backend se duerme cada 15 minutos
- ❌ Experiencia usuario frustrante

**Después (con UptimeRobot):**
- ✅ Todas las peticiones: 2-5 segundos
- ✅ Backend siempre activo 24/7
- ✅ Experiencia usuario fluida
- ✅ 100% gratis

## 📊 Panel de Control UptimeRobot

En tu dashboard verás:
- **Uptime %** - Debería estar cerca de 100%
- **Response Time** - Promedio ~200-500ms
- **Last Checked** - Hace menos de 5 minutos
- **Status** - Up (verde)

## 🔐 Seguridad

UptimeRobot solo hace **peticiones GET** al endpoint `/health`:
- ✅ No puede modificar datos
- ✅ No tiene acceso a variables de entorno
- ✅ Solo lee información pública de salud del servidor
- ✅ Es seguro y recomendado por la comunidad

## 📞 Soporte

**Si tienes problemas:**
1. Verificar status de Render: https://status.render.com
2. Verificar status de UptimeRobot: https://status.uptimerobot.com
3. Revisar logs en Render dashboard
4. Contactar soporte de Render (gratis en plan free)

## 🔗 Links Útiles

- **UptimeRobot Dashboard:** https://uptimerobot.com/dashboard
- **Render Dashboard:** https://dashboard.render.com
- **Backend URL:** https://qrvisitas.onrender.com
- **Health Check:** https://qrvisitas.onrender.com/health

---

## ✅ Checklist de Configuración

- [ ] Cuenta UptimeRobot creada y verificada
- [ ] Monitor HTTP(s) creado apuntando a `/health`
- [ ] Intervalo configurado a 5 minutos
- [ ] Monitor activo y mostrando "Up"
- [ ] Backend responde rápido (<5 segundos)
- [ ] Apps móviles conectan sin demora
- [ ] (Opcional) Timeouts reducidos en apps
- [ ] (Opcional) Alertas por email configuradas

---

**🎊 ¡Felicidades!** Tu backend ahora está optimizado y siempre activo, completamente gratis.
