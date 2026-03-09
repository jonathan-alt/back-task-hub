FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

COPY src ./src

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/server.js"]
