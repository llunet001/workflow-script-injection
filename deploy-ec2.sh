#!/bin/bash

# EC2 Deployment Script for Security Demo App
# Run this script on your EC2 instance after initial setup

set -e

echo "🚀 Starting deployment of Security Demo App..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y || sudo apt-get update -y

# Install build tools and sqlite headers (needed to compile sqlite3)
echo "🛠️  Installing build tools and SQLite headers..."
sudo yum groupinstall -y "Development Tools" 2>/dev/null || true
sudo yum install -y sqlite sqlite-devel python3 make gcc 2>/dev/null || sudo apt-get install -y sqlite3 libsqlite3-dev python3 build-essential || true

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
# Clean caches and modules to avoid wrong-arch binaries
npm cache clean --force || true
rm -rf node_modules
export npm_config_build_from_source=1
export npm_config_unsafe_perm=true
# Rebuild sqlite3 from source to match the instance architecture
npm install --production --build-from-source sqlite3 --unsafe-perm || npm install --production --unsafe-perm
npm rebuild sqlite3 --build-from-source --unsafe-perm || true

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Install and configure Nginx as reverse proxy to expose on port 80
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    sudo yum install -y nginx 2>/dev/null || sudo apt-get install -y nginx
fi

echo "🔧 Configuring Nginx reverse proxy (80 -> 3000)..."
NGINX_CONF="/etc/nginx/conf.d/security-demo.conf"
sudo bash -c "cat > $NGINX_CONF" <<'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo nginx -t && sudo systemctl enable nginx && sudo systemctl restart nginx

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
# Fetch public IP (IMDSv2 with fallback)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" || true)
if [ -n "$TOKEN" ]; then
    PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 || true)
else
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || true)
fi
echo "🌐 Access your app at: http://$PUBLIC_IP:3000"
echo ""
echo "📝 Useful commands:"
echo "  pm2 logs security-demo    - View logs"
echo "  pm2 restart security-demo - Restart app"
echo "  pm2 stop security-demo    - Stop app"
echo "  pm2 status                - Check status"
