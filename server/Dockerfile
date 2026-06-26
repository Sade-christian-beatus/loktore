# API Loktoré — Node + Prisma
FROM node:20-alpine

WORKDIR /app

# Dépendances (inclut Prisma CLI pour migrate deploy au démarrage)
COPY package*.json ./
RUN npm ci

# Schéma + génération du client
COPY prisma ./prisma
RUN npx prisma generate

# Code source
COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

# Applique les migrations puis démarre l'API
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
