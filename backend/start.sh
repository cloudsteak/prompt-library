#!/bin/bash
set -e

echo "Starting backend service..."

# Run database migrations
echo "Running database migrations..."
python run_migrations.py

# Start the application with hot-reload
echo "Starting uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
