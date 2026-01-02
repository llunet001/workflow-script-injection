#!/bin/bash

# EC2 Deployment Script for Security Demo App
# Run this script on your EC2 instance after initial setup

set -e

echo "🚀 Starting deployment of Security Demo App..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y || sudo apt-get update -y

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs || sudo apt-get install -y nodejs
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    sudo yum install -y git || sudo apt-get install -y git
fi

# Clone or update repository
REPO_DIR="/home/ec2-user/workflow-script-injection"
if [ -d "$REPO_DIR" ]; then
    echo "📥 Updating repository..."
    cd "$REPO_DIR"
    git pull
else
    echo "📥 Cloning repository..."
    cd /home/ec2-user
    git clone https://github.com/llunet001/workflow-script-injection.git
    cd workflow-script-injection
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Stop existing app if running
pm2 stop security-demo || true
pm2 delete security-demo || true

# Start the application with PM2
echo "🚀 Starting application..."
pm2 start app.js --name security-demo

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "✅ Deployment complete!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "🌐 Access your app at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo ""
echo "📝 Useful commands:"
echo "  pm2 logs security-demo    - View logs"
echo "  pm2 restart security-demo - Restart app"
echo "  pm2 stop security-demo    - Stop app"
echo "  pm2 status                - Check status"
