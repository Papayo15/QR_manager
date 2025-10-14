const { google } = require('googleapis');

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

async function getSheetsClient() {
  const auth = await getAuthClient().getClient();
  return google.sheets({ version: 'v4', auth });
}

async function getDriveClient() {
  const auth = await getAuthClient().getClient();
  return google.drive({ version: 'v3', auth });
}

module.exports = { getSheetsClient, getDriveClient };
