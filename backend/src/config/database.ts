import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const getDatabaseConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? {
        rejectUnauthorized: false
      } : false
    };
  }

  return {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'pizza_delivery',
    password: process.env.DB_PASSWORD || 'postgres',
    port: Number(process.env.DB_PORT) || 5432,
    ssl: false
  };
};

// Configuração do pool de conexões com o banco de dados
const config = getDatabaseConfig();
console.log('Database config:', { ...config, password: '****' }); // Log para debug

export const pool = new Pool(config);

// Adicione um listener para erros de conexão
pool.on('error', (err) => {
  console.error('Erro inesperado no pool do postgres', err);
}); 