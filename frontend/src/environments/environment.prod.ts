export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: 'https://pizza-delivery-api-yhro.onrender.com/api',  // Já inclui o prefixo /api
  wsUrl: 'wss://pizza-delivery-api-yhro.onrender.com'  // Websocket usa a raiz
}; 