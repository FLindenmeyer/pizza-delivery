export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
}

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  wsUrl: 'ws://localhost:3000'
}; 