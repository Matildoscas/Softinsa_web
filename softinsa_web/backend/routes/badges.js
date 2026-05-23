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

// ESTATÍSTICAS DE BADGES (comuns vs especiais - nível E)
router.get('/estatisticas/:id', async (req, res) => {
  const { id } = req.params;
 
  try {
    const result = await db.query(`
      SELECT
        COALESCE(
          COUNT(cb.ID_BADGE) FILTER (WHERE n.NOME != 'E'), 0
        ) AS badges_comuns_conquistados,
        COALESCE(
          COUNT(cb.ID_BADGE) FILTER (WHERE n.NOME = 'E'), 0
        ) AS badges_especiais_conquistados,
        (
          SELECT COALESCE(COUNT(*), 0)
          FROM BADGE_MODELO b2
          JOIN NIVEIS n2 ON b2.ID_NIVEL = n2.ID_NIVEL
          WHERE n2.NOME != 'E'
            AND b2.ID_AREA = (SELECT ID_AREA FROM CONSULTOR WHERE ID_UTILIZADOR = $1)
        ) AS total_badges_comuns,
        (
          SELECT COALESCE(COUNT(*), 0)
          FROM BADGE_MODELO b2
          JOIN NIVEIS n2 ON b2.ID_NIVEL = n2.ID_NIVEL
          WHERE n2.NOME = 'E'
            AND b2.ID_AREA = (SELECT ID_AREA FROM CONSULTOR WHERE ID_UTILIZADOR = $1)
        ) AS total_badges_especiais
      FROM CONSULTOR_BADGE cb
      RIGHT JOIN CONSULTOR c ON c.ID_UTILIZADOR = $1
      LEFT JOIN BADGE_MODELO b ON cb.ID_BADGE = b.ID_BADGE AND cb.ID_CONSULTOR = $1
      LEFT JOIN NIVEIS n ON b.ID_NIVEL = n.ID_NIVEL
    `, [id]);
 
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao buscar estatísticas de badges:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;