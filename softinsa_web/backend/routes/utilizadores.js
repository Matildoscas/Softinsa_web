const express = require('express');
const router = express.Router();
const db = require('../db');

// GET todos utilizadores
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM UTILIZADOR');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST criar utilizador
router.post('/', async (req, res) => {
  const { id_utilizador, nome_completo, email, contacto, data_criacao,estado_conta, password, aceitar_termos } = req.body;

  try {
    await db.query(
      `INSERT INTO UTILIZADOR 
       (ID_UTILIZADOR, NOME_COMPLETO, EMAIL, CONTACTO, DATA_CRIACAO, ESTADO_CONTA, PASSWORD, ACEITAR_TERMOS)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id_utilizador, nome_completo, email, contacto, data_criacao, estado_conta, password, aceitar_termos]
    );

    res.status(201).json({ message: 'Utilizador criado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;