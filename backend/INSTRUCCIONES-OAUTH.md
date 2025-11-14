# 🔐 Generar Nuevo OAuth Refresh Token

## Requisitos Previos

1. **Verificar en Google Cloud Console** que `http://localhost:3000/oauth2callback` esté en los "Authorized redirect URIs":
   - Ve a: https://console.cloud.google.com/apis/credentials
   - Selecciona tu OAuth 2.0 Client ID
   - En "Authorized redirect URIs" debe estar: `http://localhost:3000/oauth2callback`
   - Si no está, agrégalo y guarda

## Pasos para Generar el Token

### 1. Instalar dependencias (si es necesario)
```bash
npm install googleapis open
```

### 2. Exportar tus credenciales OAuth
```bash
export OAUTH_CLIENT_ID="tu_client_id_de_render"
export OAUTH_CLIENT_SECRET="tu_client_secret_de_render"
```

### 3. Ejecutar el script
```bash
node generate-oauth-token.js
```

### 4. Seguir las instrucciones
- El script abrirá una URL en tu navegador
- Inicia sesión con la cuenta `qrcasasok@gmail.com`
- Acepta los permisos solicitados
- Serás redirigido a `http://localhost:3000/oauth2callback`
- El script capturará el código y generará el refresh token

### 5. Copiar el refresh token
- El script mostrará el nuevo refresh token en la terminal
- Cópialo completo (incluyendo las comillas si las hay)

### 6. Actualizar en Render
- Ve a tu servicio en Render
- Environment → OAUTH_REFRESH_TOKEN
- Pega el nuevo token
- Guarda y espera el redeploy automático

## Solución de Problemas

### Error: "redirect_uri_mismatch"
- Verifica que `http://localhost:3000/oauth2callback` esté en Google Cloud Console
- Espera 5 minutos después de agregarlo

### Error: "EADDRINUSE"
- El puerto 3000 ya está en uso
- Mata el proceso: `lsof -ti:3000 | xargs kill -9`
- Ejecuta el script de nuevo

### No abre el navegador automáticamente
- Copia la URL que aparece en la terminal
- Ábrela manualmente en tu navegador

## Verificación Final

Después de actualizar el token en Render, revisa los logs:
```
🔐 Usando autenticación OAuth (usuario)
✨ Servicios de Google inicializados correctamente
```

Si ves esto, el OAuth funciona correctamente.
