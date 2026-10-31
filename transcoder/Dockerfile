FROM node:20-alpine

# Install FFmpeg dan FFprobe untuk transcoding video HLS
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Salin file dependensi
COPY package*.json ./

# Install dependensi produksi
RUN npm ci --omit=dev || npm install --omit=dev

# Salin source code transcoder
COPY . .

# Gunakan path binary FFmpeg dan FFprobe sistem
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe

CMD ["node", "src/worker.js"]

