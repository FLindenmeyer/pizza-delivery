const fs = require('fs');
const path = require('path');

const targetPath = './src/environments/environment.prod.ts';
const envConfigFile = `export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: '${process.env.API_URL || 'https://your-backend-url.com/api'}',
  wsUrl: '${process.env.WS_URL || 'wss://your-backend-url.com'}'
};
`;

fs.writeFileSync(targetPath, envConfigFile); 