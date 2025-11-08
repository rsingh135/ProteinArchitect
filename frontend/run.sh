#!/bin/bash

# Protein Architect Frontend Startup Script

echo "🧬 Starting Protein Architect Frontend..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start development server
echo "Starting Vite development server on http://localhost:3000"
echo ""
npm run dev

