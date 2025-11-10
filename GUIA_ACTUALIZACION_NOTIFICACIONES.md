# 📱 Guía de Actualización - Notificaciones Push

Esta guía te ayudará a activar las notificaciones push cuando decidas compilar las apps.

## 🎯 PASO 1: Actualización OTA (Ahora - Sin compilar)

Aplica los cambios actuales que NO requieren compilar:

```bash
# ResidenteApp
cd iOS/ResidenteApp
eas update --branch production --message "Botón salir y compartir QR con imagen"

# VigilanciaApp
cd ../VigilanciaApp
eas update --branch production --message "Botón salir agregado"
```

**Cambios que se aplicarán automáticamente:**
- ✅ Botón "Salir" en VigilanciaApp
- ✅ Botón "Salir" en ResidenteApp
- ✅ Compartir QR incluye imagen + texto
- ⏱️ Usuarios recibirán actualización en ~10 minutos

---

## 🔔 PASO 2: Activar Notificaciones (Futuro - Requiere compilar)

### 2.1 Instalar dependencias

```bash
cd iOS/ResidenteApp
npx expo install expo-notifications expo-device
```

### 2.2 Descomentar código en notifications.ts

Abre el archivo:
```
iOS/ResidenteApp/src/services/notifications.ts
```

Y descomentar todas las secciones marcadas con:
```typescript
// DESCOMENTAR CUANDO SE INSTALE expo-notifications:
```

### 2.3 Incrementar versión

Edita `iOS/ResidenteApp/app.json`:
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

### 2.4 Compilar nueva versión

```bash
cd iOS/ResidenteApp
eas build --platform ios --profile production
```

⏱️ Este proceso tarda ~30-40 minutos

### 2.5 Subir a TestFlight

```bash
eas submit --platform ios
```

### 2.6 Actualizar Backend

Implementa el código de `BACKEND_NOTIFICATION_EXAMPLE.js`:

1. **Instalar dependencia:**
   ```bash
   npm install expo-server-sdk
   ```

2. **Crear tabla en la base de datos:**
   ```sql
   CREATE TABLE IF NOT EXISTS push_tokens (
     id SERIAL PRIMARY KEY,
     house_number VARCHAR(10) NOT NULL,
     condominio VARCHAR(100) NOT NULL,
     push_token TEXT NOT NULL,
     platform VARCHAR(10) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     UNIQUE(house_number, condominio)
   );
   ```

3. **Agregar endpoints:**
   - POST `/api/register-push-token` (para registrar tokens)
   - Modificar POST `/api/validate-qr` (para enviar notificaciones)

4. **Deploy del backend:**
   ```bash
   git add .
   git commit -m "Agregar soporte para notificaciones push"
   git push origin main
   ```

---

## 🧪 PASO 3: Probar Notificaciones

### 3.1 En dispositivo físico (NO simulador)

1. Descargar app desde TestFlight
2. Abrir ResidenteApp
3. Aceptar permisos de notificaciones
4. Generar un código QR
5. Desde VigilanciaApp, escanear y validar el código
6. 🔔 Deberías recibir notificación en ResidenteApp

### 3.2 Endpoint de prueba

Puedes probar manualmente con:
```bash
curl -X POST https://qr-manager-3z8x.onrender.com/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "houseNumber": "25",
    "condominio": "Condominio A",
    "message": "Esta es una prueba de notificación"
  }'
```

---

## ⚠️ Importante

### Las notificaciones SOLO funcionan:
- ✅ En dispositivos físicos (iPhone/Android reales)
- ✅ Después de compilar con `eas build`
- ✅ Con la librería expo-notifications instalada
- ❌ NO funcionan en simulador iOS
- ❌ NO funcionan en emulador Android
- ❌ NO funcionan con Expo Go

### Usuarios recibirán notificaciones cuando:
1. ✅ Su código QR sea escaneado por vigilancia
2. ✅ El código sea validado exitosamente
3. ✅ Tengan la app instalada (puede estar cerrada)
4. ✅ Hayan aceptado permisos de notificaciones

---

## 📊 Monitoreo

### Ver logs de notificaciones:

En el backend:
```bash
# Render logs
https://dashboard.render.com/web/[tu-servicio]/logs
```

Buscar en los logs:
- `✅ Token registrado:` - Token guardado correctamente
- `✅ Notificación enviada:` - Notificación enviada
- `❌ Error enviando chunk:` - Error al enviar

---

## 🔄 Flujo completo

```
Usuario Residente:
1. Abre app → Acepta permisos notificaciones
2. Token se genera y guarda en backend
3. Genera código QR
4. Comparte código con visitante

Usuario Vigilancia:
5. Escanea código QR del visitante
6. Valida el código

Backend:
7. Marca código como usado
8. Busca token del residente
9. Envía notificación push

Usuario Residente:
10. 🔔 Recibe notificación "Tu código fue utilizado"
11. Abre app → Ve historial actualizado
```

---

## 📝 Checklist antes de compilar

- [ ] Instalar `expo-notifications` y `expo-device`
- [ ] Descomentar código en `notifications.ts`
- [ ] Incrementar `version` y `buildNumber` en `app.json`
- [ ] Backend tiene tabla `push_tokens` creada
- [ ] Backend tiene endpoint `/api/register-push-token`
- [ ] Backend modifica `/api/validate-qr` para enviar notificaciones
- [ ] Probar en dispositivo físico (no simulador)

---

## 🆘 Troubleshooting

### "No recibo notificaciones"
1. Verifica que estás en dispositivo físico
2. Revisa que aceptaste permisos
3. Verifica logs del backend
4. Confirma que el token se guardó en la BD

### "Token inválido"
1. El token debe empezar con `ExponentPushToken[...]`
2. Reinstalar app y volver a generar token
3. Verificar que expo-notifications esté instalado

### "La app no pide permisos"
1. Desinstalar app completamente
2. Recompilar con `eas build`
3. Reinstalar desde TestFlight
4. Al abrir debe pedir permisos

---

## 💰 Costos

- ✅ EAS Update: GRATIS (ilimitado)
- ✅ EAS Build: GRATIS (30 builds/mes en plan free)
- ✅ Notificaciones Push Expo: GRATIS (ilimitadas)
- ✅ TestFlight: GRATIS

---

¿Listo para activar notificaciones? Sigue esta guía paso a paso.
