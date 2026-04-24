const express = require('express');
const app = express();

// Configurações: Define a porta do servidor (3000 por defeito) [cite: 13, 16]
app.set('port', process.env.PORT || 3000);

// Middlewares: Permite que o servidor entenda dados em formato JSON [cite: 13]
app.use(express.json());

// Exemplo de uma Rota de Teste [cite: 13]
app.use('/teste', (req, res) => {
  res.send('Rota TESTE.');
});

// Rota Raiz [cite: 14, 16]
app.use('/', (req, res) => {
  res.send('Hello World');
});

// Inicia o servidor na porta configurada [cite: 14]
app.listen(app.get('port'), () => {
  console.log('Start server on port ' + app.get('port'));
});