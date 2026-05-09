const express = require('express');
const router = express.Router();
const db = require('../db');

// GET notificações de um utilizador específico
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const query = `
      SELECT n.* FROM NOTIFICACOES n
      JOIN UTILIZADOR_NOTIFICACAO un ON n.ID_NOTIFICACAO = un.ID_NOTIFICACAO
      WHERE un.ID_UTILIZADOR = $1
      ORDER BY n.DATA_ENVIO DESC
    `;
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;