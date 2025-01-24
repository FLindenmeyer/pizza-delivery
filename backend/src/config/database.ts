import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    };
  }

  return {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'pizza_delivery',
    password: process.env.DB_PASSWORD || 'postgres',
    port: Number(process.env.DB_PORT) || 5432,
  };
};

// Configuração do pool de conexões com o banco de dados
export const pool = new Pool(getDatabaseConfig());

// Adicione um listener para erros de conexão
pool.on('error', (err) => {
  console.error('Erro inesperado no pool do postgres', err);
}); 