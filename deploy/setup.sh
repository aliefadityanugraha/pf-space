#!/bin/bash

# =============================================================================
# PF Space - Server Setup Script
# =============================================================================
# Jalankan SATU KALI di server baru untuk menginstall semua dependencies.
# Usage: chmod +x setup.sh && sudo bash setup.sh
# =============================================================================

set -e  # Exit jika ada error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
header() { echo -e "\n${BLUE}=== $1 ===${NC}"; }

# Cek apakah dijalankan sebagai root
if [ "$EUID" -ne 0 ]; then
  error "Script harus dijalankan sebagai root: sudo bash setup.sh"
fi

header "1. Update System"
apt-get update -y && apt-get upgrade -y
log "System updated"

header "2. Install Node.js 20 LTS"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  log "Node.js $(node -v) installed"
else
  log "Node.js sudah terinstall: $(node -v)"
fi

header "3. Install PM2 (Process Manager)"
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
  pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
  log "PM2 installed"
else
  log "PM2 sudah terinstall"
fi

header "4. Install Nginx (Reverse Proxy)"
if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
  log "Nginx installed"
else
  log "Nginx sudah terinstall"
fi

header "5. Install MySQL"
if ! command -v mysql &> /dev/null; then
  apt-get install -y mysql-server
  systemctl enable mysql
  systemctl start mysql
  log "MySQL installed"
  warn "PENTING: Jalankan 'sudo mysql_secure_installation' untuk mengamankan MySQL"
else
  log "MySQL sudah terinstall"
fi

header "6. Install Certbot (SSL/HTTPS)"
if ! command -v certbot &> /dev/null; then
  apt-get install -y certbot python3-certbot-nginx
  log "Certbot installed"
else
  log "Certbot sudah terinstall"
fi

header "7. Install pnpm"
if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm
  log "pnpm installed"
else
  log "pnpm sudah terinstall"
fi

header "8. Buat direktori aplikasi"
APP_DIR="/var/www/pf-space"
mkdir -p $APP_DIR
chown $SUDO_USER:$SUDO_USER $APP_DIR
log "Direktori $APP_DIR dibuat"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Setup Server Selesai!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Langkah selanjutnya:"
echo "  1. sudo mysql_secure_installation"
echo "  2. Jalankan: bash deploy.sh"
echo ""
