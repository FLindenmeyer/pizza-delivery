export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000'
}; 