# Pizza Delivery

Sistema de gerenciamento de pedidos de pizza desenvolvido com Angular e Node.js.

## Tecnologias Utilizadas

### Backend
- Node.js
- Express
- PostgreSQL
- Socket.IO
- TypeScript
- JWT para autenticação

### Frontend
- Angular 16+
- Angular Material
- Socket.IO Client
- TypeScript

## Pré-requisitos

- Node.js 18 ou superior
- PostgreSQL 12 ou superior
- Angular CLI

## Configuração do Ambiente

### Backend

1. Instale as dependências:
```bash
cd backend
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações

3. Execute as migrações:
```bash
npm run migrate:up
```

4. Inicie o servidor:
```bash
npm run dev
```

### Frontend

1. Instale as dependências:
```bash
cd frontend
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm start
```

## Estrutura do Projeto

```
pizza-delivery/
├── backend/              # Servidor Node.js
│   ├── src/
│   │   ├── config/      # Configurações
│   │   ├── controllers/ # Controladores
│   │   ├── models/      # Modelos
│   │   ├── middlewares/ # Middlewares
│   │   └── server.ts    # Entrada da aplicação
│   └── migrations/      # Migrações do banco
└── frontend/            # Aplicação Angular
    └── src/
        ├── app/
        │   ├── core/    # Módulo core
        │   ├── shared/  # Componentes compartilhados
        │   └── features/# Funcionalidades
        └── assets/      # Recursos estáticos
```

## Funcionalidades

- Autenticação de usuários
- Criação e gerenciamento de pedidos
- Atualização em tempo real via WebSocket
- Filtros por status do pedido
- Interface responsiva

## Deployment

### Backend (Railway)
1. Configure as variáveis de ambiente no Railway
2. Conecte ao repositório GitHub
3. O Railway detectará automaticamente o Procfile

### Frontend (Vercel)
1. Conecte ao repositório GitHub
2. Configure a variável de ambiente `API_URL`
3. O Vercel detectará automaticamente a configuração Angular

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 