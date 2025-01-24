const fs = require('fs');
const path = require('path');

// Valores de fallback para desenvolvimento/testes
const DEFAULT_API_URL = 'https://pizza-delivery-api-yhro.onrender.com';
const DEFAULT_WS_URL = 'wss://pizza-delivery-api-yhro.onrender.com';

// Lê as variáveis de ambiente ou usa os valores de fallback
const apiUrl = process.env.API_URL || DEFAULT_API_URL;
const wsUrl = process.env.WS_URL || DEFAULT_WS_URL;

console.log('Building with configuration:');
console.log(`API URL: ${apiUrl}`);
console.log(`WS URL: ${wsUrl}`);

const targetPath = './src/environments/environment.prod.ts';
const envConfigFile = `export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: '${apiUrl}',
  wsUrl: '${wsUrl}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`Environment configuration written to ${targetPath}`); 