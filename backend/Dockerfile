# Build stage
FROM node:18-alpine as builder

# Increase Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Define diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências com flags específicas
RUN npm ci --only=production && \
    npm ci

# Copia código fonte
COPY . .

# Compila TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala apenas dependências de produção com flags específicas
RUN npm ci --only=production --ignore-scripts

# Copia build da stage anterior
COPY --from=builder /app/dist ./dist

# Copia arquivos de migração
COPY migrations ./migrations
COPY database.json ./

# Expõe porta
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"] 