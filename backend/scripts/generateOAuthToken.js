const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config();

/**
 * Script para generar OAuth refresh token para Google Drive
 *
 * Uso:
 * 1. Configura las variables de entorno OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URI
 * 2. Ejecuta: node scripts/generateOAuthToken.js
 * 3. Abre la URL generada en tu navegador y autoriza con la cuenta de Google que usarás para almacenar fotos
 * 4. Copia el código de autorización y pégalo en la consola
 * 5. Guarda el OAUTH_REFRESH_TOKEN generado en tus variables de entorno de Render
 */

// Validar que existan las variables de entorno
if (!process.env.OAUTH_CLIENT_ID || !process.env.OAUTH_CLIENT_SECRET || !process.env.OAUTH_REDIRECT_URI) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('Asegúrate de configurar en .env:');
  console.error('  OAUTH_CLIENT_ID=tu_client_id');
  console.error('  OAUTH_CLIENT_SECRET=tu_client_secret');
  console.error('  OAUTH_REDIRECT_URI=http://localhost:3000/oauth2callback');
  process.exit(1);
}

// Configura tus credenciales OAuth desde variables de entorno
const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI
);

// Genera la URL de autorización
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive.file'],
  prompt: 'consent' // Fuerza a mostrar el consentimiento para obtener refresh token
});

console.log('\n🔐 PASO 1: Autorizar la aplicación\n');
console.log('Abre esta URL en tu navegador (IMPORTANTE: usa la cuenta que almacenará las fotos):\n');
console.log(authUrl);
console.log('\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('🔑 PASO 2: Pega el código de autorización que aparece en la URL después de autorizar: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n✅ ¡Tokens generados exitosamente!\n');
    console.log('📋 GUARDA ESTE VALOR EN RENDER (Variable de Entorno):\n');
    console.log('OAUTH_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\n');
    console.log('ℹ️  Las otras variables ya deberían estar configuradas:');
    console.log('OAUTH_CLIENT_ID=' + process.env.OAUTH_CLIENT_ID);
    console.log('OAUTH_CLIENT_SECRET=' + process.env.OAUTH_CLIENT_SECRET);
    console.log('OAUTH_REDIRECT_URI=' + process.env.OAUTH_REDIRECT_URI);
    console.log('\n');
  } catch (error) {
    console.error('❌ Error obteniendo los tokens:', error.message);
  }
  rl.close();
});
