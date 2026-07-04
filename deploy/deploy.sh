#!/bin/bash

# =============================================================================
# PF Space - Deploy / Update Script
# =============================================================================
# Jalankan setiap kali ada update code dari Git.
# Usage: bash deploy.sh
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
header() { echo -e "\n${BLUE}=== $1 ===${NC}"; }

APP_DIR="/var/www/pf-space"

# Cek apakah .env sudah ada
if [ ! -f "$APP_DIR/backend/.env" ]; then
  error "File $APP_DIR/backend/.env belum ada! Salin dari .env.example dan isi nilainya."
fi

if [ ! -f "$APP_DIR/frontend/.env" ]; then
  error "File $APP_DIR/frontend/.env belum ada! Salin dari .env.example dan isi nilainya."
fi

header "1. Pull kode terbaru dari Git"
cd $APP_DIR
git pull origin main
log "Kode terbaru berhasil di-pull"

header "2. Install dependencies Backend"
cd $APP_DIR/backend
npm install --omit=dev
log "Backend dependencies installed"

header "3. Jalankan Migrasi Database"
NODE_ENV=production npm run migrate
log "Database migration selesai"

header "4. Build Frontend"
cd $APP_DIR/frontend
pnpm install --frozen-lockfile
pnpm run build
log "Frontend build selesai"

header "5. Restart aplikasi dengan PM2"
cd $APP_DIR
if pm2 list | grep -q "pfspace-backend"; then
  pm2 reload ecosystem.config.cjs --env production
  log "PM2 apps reloaded"
else
  pm2 start ecosystem.config.cjs --env production
  pm2 save
  log "PM2 apps started"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deploy Berhasil!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
pm2 status
