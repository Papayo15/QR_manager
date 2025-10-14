const express = require('express');
const router = express.Router();
const sheetsService = require('../services/sheetsService');

/**
 * POST /api/register-code
 * Registra un nuevo código QR
 */
router.post('/register-code', async (req, res) => {
  try {
    const result = await sheetsService.registerCode(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
