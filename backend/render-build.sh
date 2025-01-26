#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Waiting for database to be ready..."
sleep 10

npm install
npm run build

echo "Running migrations..."
npm run migrate:force

echo "Database migrations completed successfully" 