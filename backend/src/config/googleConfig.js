const { google } = require('googleapis');

// Service Account para Google Sheets
function getAuthClient() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ]
  });
  return auth;
}

// OAuth Client para Google Drive (subir fotos)
function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    process.env.OAUTH_REDIRECT_URI
  );

  // Configurar el refresh token
  oauth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REFRESH_TOKEN
  });

  return oauth2Client;
}

async function getSheetsClient() {
  const auth = await getAuthClient().getClient();
  return google.sheets({ version: 'v4', auth });
}

async function getDriveClient() {
  // Usar OAuth en lugar de Service Account para Drive
  const auth = getOAuthClient();
  return google.drive({ version: 'v3', auth });
}

module.exports = { getAuthClient, getOAuthClient, getSheetsClient, getDriveClient };
