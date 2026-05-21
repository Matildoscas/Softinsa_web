const { Pool } = require('pg');

const pool = new Pool({
  // Se detetar a variável do Render, usa-a, senão usa o localhost do teu PC
  connectionString: process.env.DATABASE_URL,
  
  user: process.env.DATABASE_URL ? undefined : 'postgres',
  host: process.env.DATABASE_URL ? undefined : 'localhost',
  database: process.env.DATABASE_URL ? undefined : 'db_Softinsa',
  password: process.env.DATABASE_URL ? undefined : 'postgres',
  port: process.env.DATABASE_URL ? undefined : 5432,
  
  // O Render OBRIGA a ter SSL ativo para conexões seguras de fora
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

module.exports = pool;