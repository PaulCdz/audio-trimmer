FROM node:20-alpine

# Dépendances nécessaires pour Node + ffmpeg modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    yt-dlp

WORKDIR /app

COPY package*.json ./

# Installation avec fallback (npm ignore certaines erreurs)
RUN npm install --omit=dev || true

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]

