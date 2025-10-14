const express = require('express');
const router = express.Router();
const sheetsService = require('../services/sheetsService');

/**
 * POST /api/register-worker
 * Registra un trabajador con foto de INE
 */
router.post('/register-worker', async (req, res) => {
  try {
    const result = await sheetsService.registerWorker(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
