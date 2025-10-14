const express = require('express');
const router = express.Router();
const sheetsService = require('../services/sheetsService');

/**
 * GET /api/get-history
 * Obtiene el historial de códigos de una casa
 */
router.get('/get-history', async (req, res) => {
  try {
    const { sheetId, sheetName, casa } = req.query;
    const history = await sheetsService.getHistory(sheetId, sheetName, casa);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
