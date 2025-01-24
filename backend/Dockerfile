FROM node:18-alpine

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências sem executar scripts
RUN npm ci --ignore-scripts

# Copia o resto dos arquivos
COPY . .

# Compila TypeScript
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# Expõe a porta
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"] 