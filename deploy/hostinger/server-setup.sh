#!/usr/bin/env bash

set -euo pipefail

DOMAIN_WEB="bphub.app"
DOMAIN_API="api.bphub.app"
DOMAIN_ADMIN="admin.bphub.app"
APP_ROOT="/var/www/bahrain-realestate"
REPO_NAME="bahrain-realestate"

echo "[1/10] Updating apt packages"
sudo apt update
sudo apt upgrade -y

echo "[2/10] Installing core packages"
sudo apt install -y curl git nginx certbot python3-certbot-nginx ufw

echo "[3/10] Installing Node.js 22 LTS"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

echo "[4/10] Enabling pnpm and installing PM2"
sudo corepack enable
sudo corepack prepare pnpm@latest --activate
sudo npm install -g pm2

echo "[5/10] Creating application directories"
sudo mkdir -p "$APP_ROOT"
sudo mkdir -p "$APP_ROOT/shared/uploads"
sudo chown -R "$USER":"$USER" "$APP_ROOT"

echo "[6/10] Firewall hardening"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "[7/10] Clone reminder"
if [[ ! -d "$APP_ROOT/$REPO_NAME/.git" ]]; then
  echo "Clone the repository into $APP_ROOT/$REPO_NAME before running deploy.sh"
else
  echo "Repository already exists at $APP_ROOT/$REPO_NAME"
fi

echo "[8/10] Nginx site install reminder"
echo "Copy deploy/hostinger/nginx/*.conf into /etc/nginx/sites-available/ and enable them"

echo "[9/10] SSL reminder"
echo "After DNS resolves, run:"
echo "  sudo certbot --nginx -d $DOMAIN_WEB -d www.$DOMAIN_WEB -d $DOMAIN_API -d $DOMAIN_ADMIN"

echo "[10/10] PM2 startup reminder"
echo "After deploy, run:"
echo "  pm2 startup systemd"
echo "  pm2 save"

echo "Base server setup completed."