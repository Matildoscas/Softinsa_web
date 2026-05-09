const express = require('express');
const router = express.Router();
const db = require('../db');

// DASHBOARD
router.get('/:id', async (req, res) => {

  const { id } = req.params;

  try {

    const result = await db.query(`
      SELECT
        COUNT(cb.ID_BADGE) AS total_badges,
        COALESCE(SUM(b.PONTOS), 0) AS total_pontos
      FROM CONSULTOR_BADGE cb
      JOIN BADGE_MODELO b
        ON cb.ID_BADGE = b.ID_BADGE
      WHERE cb.ID_CONSULTOR = $1
    `, [id]);

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;