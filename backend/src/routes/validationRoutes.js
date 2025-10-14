const express = require('express');
const router = express.Router();
const sheetsService = require('../services/sheetsService');

/**
 * POST /api/validate-qr
 * Valida un código QR
 */
router.post('/validate-qr', async (req, res) => {
  try {
    const { sheetId, codigo } = req.body;
    const result = await sheetsService.validateCode(sheetId, codigo);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/counters
 * Obtiene contadores de códigos
 */
router.get('/counters', async (req, res) => {
  try {
    const { sheetId } = req.query;
    const counters = await sheetsService.getCounters(sheetId);
    res.json(counters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
