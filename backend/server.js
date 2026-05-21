const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// rotas
const utilizadoresRoutes = require('./routes/utilizadores');
app.use('/utilizadores', utilizadoresRoutes);

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const areasRoutes = require('./routes/areas');
app.use('/areas', areasRoutes);

const dashboardRoutes = require('./routes/dashboard');
app.use('/dashboard', dashboardRoutes);

const badgesRoutes = require('./routes/badges');
app.use('/badges', badgesRoutes);

const notificacoesRoutes = require('./routes/notificacoes');
app.use('/notificacoes', notificacoesRoutes);

app.get('/', (req, res) => {
  res.send('API a funcionar');
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor a correr na porta 3000');
});