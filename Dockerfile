FROM node:20

# On installe yt-dlp + ffmpeg dans l’image
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip && \
    pip3 install --break-system-packages yt-dlp

# Dossier de travail
WORKDIR /app

# Installer les dépendances Node.js
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copier le projet
COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
