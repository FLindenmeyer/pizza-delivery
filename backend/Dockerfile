FROM node:18-alpine

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências incluindo devDependencies para build
RUN npm ci

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