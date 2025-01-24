# Build stage
FROM node:18-alpine as builder

# Define diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia código fonte
COPY . .

# Compila TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm install --only=production

# Copia build da stage anterior
COPY --from=builder /app/dist ./dist

# Copia arquivos de migração
COPY migrations ./migrations
COPY database.json ./

# Expõe porta
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"] 