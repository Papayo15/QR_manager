require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logger
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, error) => console.error(`[ERROR] ${msg}`, error || '')
};

// Configurar Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

// Ruta de salud
app.get('/health', (req, res) => {
  logger.info('Health check');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'QR Manager Backend'
  });
});

// Guardar en Google Sheets
app.post('/api/sheets/save', async (req, res) => {
  try {
    const { sheetId, data } = req.body;
    logger.info('Guardando en sheet', { sheetId, data });

    const values = [
      new Date().toISOString(),
      data.residente || data.trabajador || '',
      data.visitante || '',
      data.casa || '',
      data.codigo || '',
      data.fecha || '',
      data.hora || '',
      data.foto_url || ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:H',
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });

    logger.info('Guardado exitoso');
    res.json({ success: true, message: 'Datos guardados' });
  } catch (error) {
    logger.error('Error guardando', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validar código QR
app.post('/api/sheets/validate', async (req, res) => {
  try {
    const { sheetId, codigo } = req.body;
    logger.info('Validando código', { codigo });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:H',
    });

    const rows = response.data.values || [];
    
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][4] === codigo) {
        logger.info('Código encontrado');
        return res.json({
          success: true,
          found: true,
          data: {
            residente: rows[i][1],
            visitante: rows[i][2],
            casa: rows[i][3],
            fecha: rows[i][5],
            hora: rows[i][6]
          }
        });
      }
    }

    logger.info('Código no encontrado');
    res.json({ success: true, found: false });
  } catch (error) {
    logger.error('Error validando', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Configurar multer para fotos
const upload = multer({ storage: multer.memoryStorage() });

// Subir foto a Drive
app.post('/api/drive/upload', upload.single('photo'), async (req, res) => {
  try {
    const { nombre, casa } = req.body;
    logger.info('Subiendo foto', { nombre, casa });

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó foto' });
    }

    const date = new Date();
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Crear carpetas si no existen
    const baseFolderId = process.env.DRIVE_FOLDER_ID;
    const yearFolderId = await getOrCreateFolder(year, baseFolderId);
    const monthFolderId = await getOrCreateFolder(month, yearFolderId);
    const dayFolderId = await getOrCreateFolder(day, monthFolderId);

    // Subir foto
    const fileName = `${Date.now()}_${nombre.replace(/\s/g, '_')}.jpg`;
    const fileMetadata = {
      name: fileName,
      parents: [dayFolderId],
    };
    const media = {
      mimeType: 'image/jpeg',
      body: require('stream').Readable.from(req.file.buffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    // Hacer público
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    logger.info('Foto subida exitosamente', file.data);
    res.json({
      success: true,
      url: file.data.webViewLink,
      fileId: file.data.id
    });
  } catch (error) {
    logger.error('Error subiendo foto', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Función auxiliar para crear/obtener carpetas
async function getOrCreateFolder(name, parentId) {
  try {
    const response = await drive.files.list({
      q: `name='${name}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id)',
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    const folder = await drive.files.create({
      requestBody: {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });

    return folder.data.id;
  } catch (error) {
    logger.error('Error creando carpeta', error);
    throw error;
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`Servidor ejecutándose en puerto ${PORT}`);
});
