#!/bin/bash

echo "Deploying noob-blog to AWS..."

# Build frontend
echo "Building frontend..."
cd frontend && npm run build && cd ..

# Deploy infrastructure
echo "Deploying infrastructure with CDK..."
cd infrastructure && npm run deploy && cd ..

echo "Deployment complete!"