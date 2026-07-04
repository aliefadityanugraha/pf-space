#!/bin/bash

# =============================================================================
# PF Space - Database Setup Script
# =============================================================================
# Jalankan SATU KALI untuk membuat database dan user MySQL.
# Usage: sudo bash db-setup.sh
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
header() { echo -e "\n${BLUE}=== $1 ===${NC}"; }

# ===================== EDIT BAGIAN INI =====================
DB_NAME="si_film_archive"
DB_USER="pfspace_user"
DB_PASSWORD="ganti_dengan_password_kuat"  # <-- GANTI INI
# ===========================================================

header "Membuat Database & User MySQL"

mysql -u root -p <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SHOW DATABASES;
SQL

log "Database '${DB_NAME}' dan user '${DB_USER}' berhasil dibuat!"
echo ""
echo "Gunakan nilai berikut di backend/.env:"
echo "  DB_HOST=localhost"
echo "  DB_PORT=3306"
echo "  DB_USER=${DB_USER}"
echo "  DB_PASSWORD=${DB_PASSWORD}"
echo "  DB_NAME=${DB_NAME}"
