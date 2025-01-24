export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: 'https://pizza-delivery-api-yhro.onrender.com',  // URL correta do backend no Render
  wsUrl: 'wss://pizza-delivery-api-yhro.onrender.com' // URL correta do WebSocket
}; 