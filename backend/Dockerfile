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

# Script para executar migrações e iniciar o servidor
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Comando para iniciar
ENTRYPOINT ["docker-entrypoint.sh"] 