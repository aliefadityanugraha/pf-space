# 🚀 Panduan Deploy PF Space ke Self-Hosted Server

> Stack: **Vue 3 (Vite) + Fastify + MySQL** — dijalankan di Ubuntu/Debian Server

---

## 📋 Gambaran Arsitektur

```
Internet → Nginx (port 80/443) → Frontend (static /dist)
                               → Backend API (localhost:3000)
                               → Upload endpoint (localhost:3000)
```

Semua file script deploy ada di folder `deploy/` di root project.

---

## ✅ Checklist Sebelum Mulai

- [ ] Server Ubuntu/Debian sudah siap (minimal 1 GB RAM, 10 GB disk)
- [ ] Akses SSH ke server
- [ ] (Opsional) Domain sudah diarahkan ke IP server

---

## TAHAP 1 — Setup Server (Satu Kali)

### 1.1 Upload dan jalankan script setup

```bash
# Dari lokal, upload script ke server
scp deploy/setup.sh user@IP_SERVER:/tmp/

# SSH ke server, lalu jalankan
ssh user@IP_SERVER
chmod +x /tmp/setup.sh
sudo bash /tmp/setup.sh
```

Script ini otomatis menginstall: Node.js 20, PM2, Nginx, MySQL, Certbot, pnpm.

### 1.2 Amankan MySQL

```bash
sudo mysql_secure_installation
```

### 1.3 Buat database & user MySQL

```bash
scp deploy/db-setup.sh user@IP_SERVER:/tmp/
nano /tmp/db-setup.sh   # ganti DB_PASSWORD
sudo bash /tmp/db-setup.sh
```

---

## TAHAP 2 — Clone dan Konfigurasi Project

```bash
cd /var/www
sudo git clone https://github.com/USERNAME/pf-space.git
sudo chown -R $USER:$USER /var/www/pf-space
```

### Backend `.env`

```bash
cd /var/www/pf-space/backend
cp ../deploy/backend.env.production .env
nano .env
```

**Wajib diisi:**

| Variable | Nilai |
|---|---|
| `DB_USER` | User MySQL dari tahap 1.3 |
| `DB_PASSWORD` | Password MySQL |
| `BETTER_AUTH_SECRET` | Random string 32+ karakter |
| `BETTER_AUTH_URL` | `https://yourdomain.com` atau `http://IP_SERVER` |
| `FRONTEND_URL` | Sama dengan `BETTER_AUTH_URL` |

**Generate secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend `.env`

```bash
cd /var/www/pf-space/frontend
cp ../deploy/frontend.env.production .env
nano .env   # ubah VITE_API_BASE_URL ke domain/IP server
```

---

## TAHAP 3 — Konfigurasi Nginx

```bash
nano /var/www/pf-space/deploy/pf-space.nginx.conf  # ganti yourdomain.com

sudo cp /var/www/pf-space/deploy/pf-space.nginx.conf /etc/nginx/sites-available/pf-space
sudo ln -s /etc/nginx/sites-available/pf-space /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t && sudo systemctl reload nginx
```

### Aktifkan HTTPS (jika punya domain)

```bash
sudo certbot --nginx -d yourdomain.com
```

---

## TAHAP 4 — Deploy Pertama

```bash
cd /var/www/pf-space
bash deploy/deploy.sh
```

Akan otomatis: git pull → npm install → migrate DB → build frontend → start PM2.

---

## TAHAP 5 — Google OAuth

Di Google Cloud Console, tambahkan authorized redirect URI:
```
https://yourdomain.com/api/auth/callback/google
```

---

## 🔄 Update Rutin

```bash
cd /var/www/pf-space && bash deploy/deploy.sh
```

---

## 🛠️ Perintah Berguna

```bash
pm2 status
pm2 logs pfspace-backend
pm2 restart pfspace-backend
sudo tail -f /var/log/nginx/error.log
```

---

## ⚠️ Troubleshooting

| Masalah | Solusi |
|---|---|
| `502 Bad Gateway` | Backend belum jalan — cek `pm2 logs pfspace-backend` |
| Auth `state_mismatch` | Pastikan `TRUST_PROXY=true` di `.env` backend |
| Cookie tidak tersimpan | `BETTER_AUTH_URL` harus pakai domain yang sama |
| Upload gagal | `client_max_body_size` di nginx perlu diperbesar |
| PM2 mati setelah reboot | Jalankan `pm2 startup` dan `pm2 save` |

---

## 📁 File di Folder `deploy/`

| File | Fungsi |
|---|---|
| `setup.sh` | Install semua dependencies server (SEKALI) |
| `db-setup.sh` | Buat database & user MySQL (SEKALI) |
| `deploy.sh` | Deploy/update app (setiap update) |
| `pf-space.nginx.conf` | Template konfigurasi Nginx |
| `backend.env.production` | Template `.env` backend production |
| `frontend.env.production` | Template `.env` frontend production |
