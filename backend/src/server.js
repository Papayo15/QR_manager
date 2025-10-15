const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const sheetsService = require('./services/sheetsService');

// Health check endpoint para UptimeRobot
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'QR Manager Backend',
    version: '2.0',
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
    message: '🏠 QR Manager Backend v2.0',
    status: 'online',
    platform: 'Render.com',
    keepAlive: 'UptimeRobot monitoring /health',
    endpoints: [
      'GET /health - Health check (monitored by UptimeRobot)',
      'POST /api/register-code',
      'POST /api/validate-qr',
      'POST /api/register-worker',
      'GET /api/get-history',
      'GET /api/counters'
    ]
  });
});

// Registrar código QR
app.post('/api/register-code', async (req, res) => {
  try {
    const result = await sheetsService.registerCode(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validar código QR
app.post('/api/validate-qr', async (req, res) => {
  try {
    const { sheetId, codigo } = req.body;
    const result = await sheetsService.validateCode(sheetId, codigo);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar trabajador
app.post('/api/register-worker', async (req, res) => {
  try {
    const result = await sheetsService.registerWorker(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial
app.get('/api/get-history', async (req, res) => {
  try {
    const { sheetId, sheetName, casa } = req.query;
    const history = await sheetsService.getHistory(sheetId, sheetName, casa);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener contadores
app.get('/api/counters', async (req, res) => {
  try {
    const { sheetId } = req.query;
    const counters = await sheetsService.getCounters(sheetId);
    res.json(counters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
