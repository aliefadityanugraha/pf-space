#!/bin/sh
set -e

# Pastikan folder uploads tersedia
mkdir -p /app/uploads/videos/hls /app/uploads/documents /app/uploads/images /app/uploads/avatars

# Jalankan migrasi database Knex jika diaktifkan (default: true)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "==> Menjalankan migrasi database Knex..."
  npm run migrate
fi

# Opsional: jalankan seed jika RUN_SEED=true
if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "==> Menjalankan database seed..."
  npm run seed || echo "==> Seeding dilewati atau sudah ada."
fi

echo "==> Menjalankan Fastify server..."
exec "$@"

