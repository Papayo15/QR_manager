const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const sheetsService = require('./services/sheetsService');
const driveService = require('./services/driveService');
const { mapAppParamsToBackend, generateQRCode, getCurrentDateTime, getSpreadsheetId } = require('./utils/paramMapper');

// Health check endpoint para UptimeRobot
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'QR Manager Backend',
    version: '2.1',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + ' seconds',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: '🏠 QR Manager Backend v2.1',
    status: 'online',
    platform: 'Render.com',
    keepAlive: 'UptimeRobot monitoring /health',
    improvements: 'Adaptado para comunicación directa con apps móviles',
    endpoints: [
      'GET /health - Health check (monitored by UptimeRobot)',
      'POST /api/register-code - Acepta { houseNumber, condominio }',
      'POST /api/validate-qr - Acepta { code }',
      'POST /api/register-worker - Acepta { houseNumber, condominio, workerType, photoBase64 } → Sube foto a Drive',
      'GET /api/get-history - Acepta ?houseNumber=X&condominio=Y',
      'GET /api/counters - No requiere parámetros'
    ]
  });
});

// Registrar código QR
app.post('/api/register-code', async (req, res) => {
  try {
    console.log('📥 Solicitud de registro de código:', req.body);

    // Mapear parámetros de la app al formato interno
    const { sheetId, sheetName, casa, condominio } = mapAppParamsToBackend(req.body);

    // Generar código QR y obtener fecha/hora
    const codigo = generateQRCode();
    const { fecha, hora, mes, año } = getCurrentDateTime();

    // Preparar datos para el servicio
    const serviceData = {
      sheetId,
      sheetName,
      codigo,
      visitante: req.body.visitante || 'Visitante',
      residente: req.body.residente || `Casa ${casa}`,
      casa,
      fecha,
      hora,
      mes,
      año
    };

    const result = await sheetsService.registerCode(serviceData);

    // Responder con formato esperado por la app
    res.json({
      success: true,
      data: {
        code: codigo,
        houseNumber: parseInt(casa, 10),
        condominio: condominio,
        visitante: serviceData.visitante,
        residente: serviceData.residente,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isUsed: false,
        timestamp: `${fecha} ${hora}`,
        estado: "activo"
      }
    });
  } catch (error) {
    console.error('❌ Error en /api/register-code:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validar código QR
app.post('/api/validate-qr', async (req, res) => {
  try {
    console.log('📥 Solicitud de validación de código:', req.body);

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Se requiere el código QR' });
    }

    // Usar SPREADSHEET_ID global
    const spreadsheetId = getSpreadsheetId();

    const result = await sheetsService.validateCode(spreadsheetId, code);

    // Adaptar respuesta al formato esperado por la app
    const valid = result.status === 'VALIDADO';
    res.json({
      success: true,
      data: {
        valid,
        message: result.message || (valid ? `Acceso permitido: ${result.nombre}` : 'Acceso denegado'),
        houseNumber: valid ? parseInt(result.casa, 10) : undefined,
        expiresAt: valid ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
      }
    });
  } catch (error) {
    console.error('❌ Error en /api/validate-qr:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Registrar trabajador
app.post('/api/register-worker', async (req, res) => {
  try {
    console.log('📥 Solicitud de registro de trabajador');

    const { houseNumber, condominio, workerType, photoBase64 } = req.body;

    // Validar que se envió la foto
    if (!photoBase64) {
      return res.status(400).json({ success: false, error: 'Se requiere la foto en base64' });
    }

    // Mapear parámetros
    const { sheetId, sheetName, casa } = mapAppParamsToBackend({ houseNumber, condominio });

    // Obtener fecha/hora
    const { fecha, hora, mes, año } = getCurrentDateTime();

    // Subir foto a Google Drive
    console.log('📤 Subiendo foto a Google Drive...');
    const fileName = driveService.generateFileName(casa, workerType);
    const photoUrl = await driveService.uploadImage(photoBase64, fileName);
    console.log(`✅ Foto subida: ${photoUrl}`);

    // Preparar datos para el servicio
    const serviceData = {
      sheetId,
      sheetName,
      trabajador: `Trabajador ${workerType}`,
      tipo_servicio: workerType,
      casa,
      foto_url: photoUrl, // URL de Drive en lugar de base64
      fecha,
      hora,
      mes,
      año
    };

    const result = await sheetsService.registerWorker(serviceData);

    res.json({
      success: true,
      data: {
        message: 'Trabajador registrado exitosamente',
        sheetName: result.sheetName,
        photoUrl: photoUrl
      }
    });
  } catch (error) {
    console.error('❌ Error en /api/register-worker:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener historial
app.get('/api/get-history', async (req, res) => {
  try {
    console.log('📥 Solicitud de historial:', req.query);

    const { houseNumber, condominio } = req.query;

    if (!houseNumber || !condominio) {
      return res.status(400).json({ success: false, error: 'Se requieren houseNumber y condominio' });
    }

    // Mapear parámetros
    const { sheetId, sheetName, casa } = mapAppParamsToBackend({
      houseNumber: parseInt(houseNumber, 10),
      condominio
    });

    const codes = await sheetsService.getHistory(sheetId, sheetName, casa);

    // Adaptar formato para la app
    const formattedCodes = codes.map(code => ({
      codigo: code.code || code.codigo,
      condominio: condominio,
      casa: casa,
      timestamp: code.fecha && code.hora ? `${code.fecha} ${code.hora}` : new Date().toLocaleString('es-MX'),
      estado: code.resultado === 'VALIDADO' ? 'validado' : code.resultado === 'NEGADO' ? 'negado' : 'activo'
    }));

    res.json({
      success: true,
      data: formattedCodes
    });
  } catch (error) {
    console.error('❌ Error en /api/get-history:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener contadores
app.get('/api/counters', async (req, res) => {
  try {
    console.log('📥 Solicitud de contadores');

    // Usar SPREADSHEET_ID global
    const spreadsheetId = getSpreadsheetId();

    const counters = await sheetsService.getCounters(spreadsheetId);

    // Adaptar formato para la app
    res.json({
      success: true,
      data: {
        generados: counters.generados || 0,
        avalados: counters.validados || 0,
        negados: counters.negados || 0
      }
    });
  } catch (error) {
    console.error('❌ Error en /api/counters:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📋 Version 2.1 - Adaptado para apps móviles`);
});
