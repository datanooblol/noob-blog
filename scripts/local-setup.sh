#!/bin/bash

echo "Setting up local development environment..."

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from template"
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && pip install -r requirements.txt && cd ..

# Install infrastructure dependencies
echo "Installing infrastructure dependencies..."
cd infrastructure && npm install && cd ..

# Start Docker services
echo "Starting Docker services..."
cd docker && docker-compose up -d

# Wait for DynamoDB Local
echo "Waiting for DynamoDB Local to start..."
sleep 5

# Create DynamoDB tables
echo "Creating DynamoDB tables..."
python scripts/seed-data.py

echo "Local development environment ready!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8001"
echo "DynamoDB Admin: http://localhost:8000"