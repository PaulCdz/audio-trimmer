FROM node:20-alpine

# Dépendances système
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    yt-dlp

WORKDIR /app

# Copier d’abord package.json pour permettre le cache Docker
COPY package*.json ./

# Installer les dépendances
RUN npm install --quiet

# Copier le reste du projet
COPY . .

EXPOSE 8080

CMD ["node", "server.js"]

