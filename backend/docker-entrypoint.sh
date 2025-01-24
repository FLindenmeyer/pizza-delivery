#!/bin/sh

# Aguarda alguns segundos para garantir que o banco de dados está pronto
echo "Waiting for database to be ready..."
sleep 5

# Executa as migrações
echo "Running database migrations..."
npm run migrate:up

# Inicia o servidor
echo "Starting server..."
npm start 