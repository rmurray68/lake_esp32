#!/bin/bash

# Lake ESP32 Dashboard - Quick Deploy Script
# This script helps you get the dashboard running

echo "🏠 Lake ESP32 Dashboard Deployment"
echo "=================================="
echo ""

# Check Node version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Current Node version: $NODE_VERSION"

if [[ $NODE_VERSION == v25* ]]; then
    echo "⚠️  Warning: Node.js v25 has compatibility issues with Amplify CLI"
    echo ""
    echo "Recommended: Install Node.js v22 LTS"
    echo ""
    echo "To install Node 22:"
    echo "  1. Install nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash"
    echo "  2. Restart terminal: source ~/.zshrc"
    echo "  3. Install Node 22: nvm install 22"
    echo "  4. Use Node 22: nvm use 22"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting. Please install Node 22 and try again."
        exit 1
    fi
fi

echo ""
echo "Choose deployment option:"
echo "  1. Test frontend only (with mock data) - Works now!"
echo "  2. Deploy full stack (requires Node 22)"
echo "  3. Show deployment guides"
echo ""
read -p "Enter choice (1-3): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo "🚀 Starting frontend with mock data..."
        echo ""
        echo "The dashboard will open at http://localhost:5173"
        echo "Press Ctrl+C to stop the server"
        echo ""
        cd web-dashboard
        npm run dev
        ;;
    2)
        echo "🔧 Deploying full stack..."
        echo ""
        echo "Step 1: Starting backend (Amplify Sandbox)..."
        echo "This will create AWS resources in your account."
        echo ""
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "Starting sandbox... (this may take a few minutes)"
            echo "Keep this terminal open!"
            echo ""
            npx ampx sandbox &
            SANDBOX_PID=$!
            
            echo ""
            echo "Sandbox is starting (PID: $SANDBOX_PID)"
            echo ""
            echo "Once sandbox is ready, open a new terminal and run:"
            echo "  cd web-dashboard"
            echo "  npm run dev"
            echo ""
            echo "Press Ctrl+C to stop the sandbox"
            wait $SANDBOX_PID
        fi
        ;;
    3)
        echo "📚 Deployment Guides:"
        echo ""
        echo "  QUICK_START.md          - Get started quickly"
        echo "  AMPLIFY_SETUP.md        - Detailed setup guide"
        echo "  INTEGRATION_GUIDE.md    - Connect to AWS resources"
        echo "  DEPLOYMENT_CHECKLIST.md - Production deployment"
        echo "  PROJECT_SUMMARY.md      - Project overview"
        echo ""
        echo "Open any of these files to learn more!"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac
