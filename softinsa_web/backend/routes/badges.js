const express = require('express');
const router = express.Router();
const db = require('../db');


// BADGES CONQUISTADOS (Histórico do utilizador)
router.get('/conquistados/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        b.ID_BADGE,
        b.NOME,
        b.DESCRICAO,
        b.PONTOS,
        cb.DATA_ATRIBUICAO -- Nome correto da coluna
      FROM CONSULTOR_BADGE cb
      JOIN BADGE_MODELO b ON cb.ID_BADGE = b.ID_BADGE
      WHERE cb.ID_CONSULTOR = $1
      ORDER BY cb.DATA_ATRIBUICAO DESC
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar badges conquistados:", err);
    res.status(500).json({ error: err.message });
  }
});

// BADGES RECOMENDADOS
router.get('/recomendados/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Descobrir a área do consultor
    // 2. Buscar badges dessa área que o consultor ainda NÃO tem
    const result = await db.query(`
      SELECT b.ID_BADGE, b.NOME, b.DESCRICAO, b.PONTOS 
      FROM BADGE_MODELO b
      WHERE b.ID_AREA = (SELECT ID_AREA FROM CONSULTOR WHERE ID_UTILIZADOR = $1)
      AND b.ID_BADGE NOT IN (SELECT ID_BADGE FROM CONSULTOR_BADGE WHERE ID_CONSULTOR = $1)
      LIMIT 3
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// BADGES COM PROGRESSO
router.get('/progresso/:id', async (req, res) => {

  const { id } = req.params;

  try {

    const result = await db.query(`
      SELECT 
        b.ID_BADGE,
        b.NOME,
        b.DESCRICAO,
        b.PONTOS,
        cb.DATA_ATRIBUICAO
      FROM CONSULTOR_BADGE cb
      JOIN BADGE_MODELO b 
        ON cb.ID_BADGE = b.ID_BADGE
      WHERE cb.ID_CONSULTOR = $1
      ORDER BY cb.DATA_ATRIBUICAO DESC
    `, [id]);

    res.json(result.rows);

  } catch (err) {

    console.error("ERRO SQL:", err);

    res.status(500).json({
      error: err.message
    });
  }
});


// BADGE ESPECIAL
router.get('/especial', async (req, res) => {

  try {

    const result = await db.query(`
      SELECT
        NOME,
        DESCRICAO,
        PONTOS
      FROM BADGE_MODELO
      ORDER BY PONTOS DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json(null);
    }

    const badge = result.rows[0];

    badge.dias = 7;

    res.json(badge);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;