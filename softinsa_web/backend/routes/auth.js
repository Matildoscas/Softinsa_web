const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { enviarEmailVerificacao } =
require('../services/emailService');

const SECRET = "segredo_super_secreto";


// ======================================================
// LOGIN
// ======================================================

router.post('/login', async (req, res) => {

  const { email, password } = req.body;

  try {

    const result = await db.query(
      'SELECT * FROM UTILIZADOR WHERE EMAIL = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Utilizador não encontrado'
      });
    }

    const user = result.rows[0];

    // Verificar email confirmado
    if (user.email_verificado !== true) {

      return res.status(403).json({
        error: 'Confirme o email primeiro'
      });
    }

    // Password simples
    if (user.password !== password) {

      return res.status(401).json({
        error: 'Password incorreta'
      });
    }

    // Criar token JWT
    const token = jwt.sign(
      {
        id: user.id_utilizador,
        email: user.email
      },
      SECRET,
      {
        expiresIn: '1h'
      }
    );

    // remover password
    const { password: _, ...userSemPassword } = user;

    res.json({
      token,
      user: userSemPassword
    });

  } catch (err) {

    console.error("ERRO LOGIN:", err);

    res.status(500).json({
      error: err.message
    });
  }
});


// ======================================================
// REGISTO
// ======================================================

router.post('/register', async (req, res) => {

  console.log("RECEBI UM PEDIDO DE REGISTO:", req.body);

  const {
    nome,
    email,
    password,
    aceitar_termos,
    id_area
  } = req.body;

  try {

    // validação
    if (!nome || !email || !password || !id_area) {

      return res.status(400).json({
        error: 'Campos obrigatórios em falta'
      });
    }

    // verificar email existente
    const existe = await db.query(
      'SELECT 1 FROM UTILIZADOR WHERE EMAIL = $1',
      [email]
    );

    if (existe.rows.length > 0) {

      return res.status(400).json({
        error: 'Email já existe'
      });
    }

    // gerar id
    //const novoId = Date.now();

    // gerar token email
    // gerar token email
    const token = crypto
      .randomBytes(32)
      .toString('hex');

    // inserir utilizador
    const result = await db.query(
      `INSERT INTO UTILIZADOR
      (
        NOME_COMPLETO,
        EMAIL,
        CONTACTO,
        DATA_CRIACAO,
        ESTADO_CONTA,
        PASSWORD,
        ACEITAR_TERMOS,
        EMAIL_VERIFICADO,
        TOKEN_VERIFICACAO
      )
      VALUES
      (
        $1,
        $2,
        '',
        NOW(),
        'PENDENTE',
        $3,
        $4,
        false,
        $5
      )
      RETURNING ID_UTILIZADOR`,
      [
        nome,
        email,
        password,
        aceitar_termos,
        token
      ]
    );

    // ID GERADO PELO POSTGRES
    const userId = result.rows[0].id_utilizador;

    // inserir consultor
    await db.query(
      `INSERT INTO CONSULTOR
      (
        ID_UTILIZADOR,
        ID_AREA
      )
      VALUES ($1, $2)`,
      [
        userId,
        id_area
      ]
    );

    try {
            await enviarEmailVerificacao(email, token);
        } catch (emailErr) {
            console.error("O utilizador foi criado, mas o email falhou:", emailErr);
            // Não enviamos erro 500 aqui, senão o Flutter acha que não registrou
            return res.status(201).json({ 
                message: 'Registo concluído, mas houve um erro ao enviar o email de confirmação. Contacte o suporte.' 
            });
        }

    res.status(201).json({ message: 'Registo concluído' });

  } catch (err) {

    console.error("ERRO REGISTER:", err);

    res.status(500).json({
      error: err.message
    });
  }
});


// ======================================================
// VERIFICAR EMAIL (COM TRANSFORMAÇÃO CORPORATIVA)
// ======================================================

router.get('/verificar-email', async (req, res) => {
  const { token } = req.query;

  try {
    const result = await db.query(
      `SELECT * FROM UTILIZADOR WHERE TOKEN_VERIFICACAO = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.send(`<div style="..."><h2>Token inválido ou expirado</h2></div>`);
    }

    const user = result.rows[0];
    const emailPessoal = user.email;

    // LÓGICA DE TRANSFORMAÇÃO:
    // Pega na parte antes do @ e adiciona @softinsa.pt
    const parteLocal = emailPessoal.split('@')[0];
    const emailCorporativo = `${parteLocal}@softinsa.pt`;

    // ATUALIZAÇÃO FINAL: Verifica, Ativa e Troca o Email
    await db.query(
      `UPDATE UTILIZADOR
       SET EMAIL = $1,
           EMAIL_VERIFICADO = true,
           ESTADO_CONTA = 'ATIVO',
           TOKEN_VERIFICACAO = null
       WHERE ID_UTILIZADOR = $2`,
      [emailCorporativo, user.id_utilizador]
    );

    res.send(`
      <div style="font-family:Arial;padding:30px; text-align:center;">
        <h2 style="color: #2e7d32;">Email confirmado com sucesso!</h2>
        <p>A sua conta foi ativada com o e-mail corporativo:</p>
        <strong style="font-size: 1.2em;">${emailCorporativo}</strong>
        <p style="margin-top:20px;">Já pode voltar à aplicação e iniciar sessão com este novo e-mail.</p>
      </div>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao processar ativação.");
  }
});


// ======================================================
// ALTERAR PARA EMAIL CORPORATIVO
// ======================================================

router.put('/alterar-email-corporativo', async (req, res) => {

  const {
    id_utilizador,
    novo_email
  } = req.body;

  try {

    // verificar se email já existe
    const existe = await db.query(
      `SELECT 1
       FROM UTILIZADOR
       WHERE EMAIL = $1`,
      [novo_email]
    );

    if (existe.rows.length > 0) {

      return res.status(400).json({
        error: 'Esse email já está em uso'
      });
    }

    // atualizar MESMO utilizador
    await db.query(
      `UPDATE UTILIZADOR
       SET EMAIL = $1
       WHERE ID_UTILIZADOR = $2`,
      [
        novo_email,
        id_utilizador
      ]
    );

    res.json({
      message: 'Email corporativo atualizado'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;