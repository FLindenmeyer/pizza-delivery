export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: '/api',  // This will be replaced by Netlify's URL rewrite
  wsUrl: '' // This will be set during build time
}; 