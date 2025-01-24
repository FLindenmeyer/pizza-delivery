# Estágio de build
FROM node:18-alpine as builder

WORKDIR /app

# Copia arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./

# Instala dependências
RUN npm ci

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM node:18-alpine

WORKDIR /app

# Cria usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copia build e dependências de produção
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production

# Define usuário não-root
USER appuser

EXPOSE 3000

# Adiciona healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "start"] 