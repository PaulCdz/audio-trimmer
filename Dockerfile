FROM node:20-alpine

# Dépendances système
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install --quiet

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]

