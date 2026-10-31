# Gunakan base image Node.js 20 Alpine
FROM node:20-alpine

# Install tools yang dibutuhkan: libc6-compat (untuk modul native), curl (untuk healthcheck)
RUN apk add --no-cache libc6-compat curl

# Tentukan working directory
WORKDIR /app

# Salin file dependensi
COPY package*.json ./

# Install dependensi produksi
RUN npm ci --omit=dev || npm install --omit=dev

# Salin seluruh kode backend
COPY . .

# Buat direktori uploads dan pastikan permission
RUN mkdir -p uploads/videos/hls uploads/documents uploads/images uploads/avatars

# Normalisasi line endings (CRLF -> LF) dan berikan izin eksekusi pada entrypoint
RUN if [ -f /app/docker-entrypoint.sh ]; then \
      tr -d '\r' < /app/docker-entrypoint.sh > /app/docker-entrypoint-clean.sh && \
      mv /app/docker-entrypoint-clean.sh /app/docker-entrypoint.sh && \
      chmod +x /app/docker-entrypoint.sh; \
    fi

# Buka port backend
EXPOSE 3001

# Set entrypoint & command
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
