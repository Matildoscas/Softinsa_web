var Sequelize = require('sequelize');

// Configuração da ligação: ('nome_bd', 'utilizador', 'palavra_passe', { ... }) [cite: 38]
const sequelize = new Sequelize('teste', 'postgres', 'postgres', {
  host: 'localhost',
  port: '5432',
  dialect: 'postgres', // Define que o SGBD é o PostgreSQL [cite: 38]
});

module.exports = sequelize;