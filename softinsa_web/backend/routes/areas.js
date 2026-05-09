const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT ID_AREA as id, NOME as nome FROM AREAS'
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;