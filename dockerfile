# ---- Сборка (Alpine + только JS-зависимости: без нативного bcrypt) ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN node ./node_modules/prisma/build/index.js generate

COPY . .
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

RUN chown -R node:node /app
USER node

ENV PORT=3000
EXPOSE 3000

CMD ["/bin/sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy && node dist/main.js"]
