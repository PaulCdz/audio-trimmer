FROM node:20-alpine

# Installer ffmpeg + yt-dlp (compatibles ARM)
RUN apk add --no-cache ffmpeg yt-dlp

WORKDIR /app

# Dépendances Node.js
COPY package*.json ./
RUN npm install

# Copier le backend + frontend
COPY . .

EXPOSE 8080

CMD ["node", "server.js"]

