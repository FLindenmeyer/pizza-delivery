# Estágio de build
FROM node:18-alpine as builder

WORKDIR /app

# Copia arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./

# Instala dependências
RUN npm ci

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copia build do estágio anterior
COPY --from=builder /app/dist/pizza-delivery /usr/share/nginx/html

# Copia configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"] 