#!/bin/bash

# Checks if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "❌ Error: Docker is not installed. Please install Docker."
    exit 1
fi

# Detects the correct command for Docker Compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: Docker Compose not found. Install standalone docker-compose or use Docker CLI with 'docker compose' support."
    exit 1
fi

# Checks for .env file in lost-in-europe directory
if [ ! -f ./lost-in-europe/.env ]; then
    echo "⚠️  .env file not found in ./lost-in-europe/, creating from .env.example..."
    cp ./lost-in-europe/.env.example ./lost-in-europe/.env
    echo "✅ .env file created successfully!"
fi

# Runs Docker Compose
echo "🚀 Starting containers with command: $DOCKER_COMPOSE_CMD up --build"
$DOCKER_COMPOSE_CMD up --build

