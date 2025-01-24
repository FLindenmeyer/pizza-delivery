#!/bin/sh

# Aguarda o banco de dados estar pronto
echo "Waiting for database to be ready..."
for i in $(seq 1 30); do
    if npm run migrate:up; then
        echo "Database migrations completed successfully"
        break
    fi
    echo "Migration attempt $i failed, waiting..."
    sleep 2
done

# Inicia o servidor
echo "Starting server..."
exec npm start 