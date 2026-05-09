const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use true para a porta 465
  auth: {
    user: 'matidossantos55@gmail.com',
    pass: 'rdkgcjrnbjrvmdpw' // Use a senha de app atualizada aqui
  },
  tls: {
    rejectUnauthorized: false // Ajuda se houver bloqueios de firewall local
  }
});

async function enviarEmailVerificacao(email, token) {

  const link =
    `http://192.168.1.76:3000/auth/verificar-email?token=${token}`;

  try {

    const info = await transporter.sendMail({

      from: '"Softinsa Academy" <matidossantos55@gmail.com>',

      to: email,

      subject: 'Confirmar Conta',

      html: `
        <div style="font-family: Arial; padding:20px;">

          <h2>Bem-vindo à Softinsa Academy</h2>

          <p>
            Clique no botão abaixo para confirmar a sua conta:
          </p>

          <a href="${link}"
            style="
              background:#4470AF;
              color:white;
              padding:12px 20px;
              text-decoration:none;
              border-radius:8px;
              display:inline-block;
            ">
            Confirmar Conta
          </a>

        </div>
      `
    });

    console.log("EMAIL ENVIADO:", info.response);

  } catch (err) {

    console.error("ERRO AO ENVIAR EMAIL:", err);

    throw err;
  }
}

module.exports = {
  enviarEmailVerificacao
};