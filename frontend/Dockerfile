# Stage 1: Build Vue/Vite frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Salin file dependensi
COPY package*.json ./

# Install seluruh dependensi termasuk devDependencies untuk build
RUN npm ci || npm install

# Salin source code frontend
COPY . .

# Argument build untuk API URL (kosongkan agar menggunakan window.location.origin via Nginx proxy)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Jalankan build
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Salin konfigurasi Nginx kustom (SPA routing + reverse proxy ke backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin output build dari builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
