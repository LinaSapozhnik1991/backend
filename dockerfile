# ---- Этап 1: сборка ----
    FROM node:20-alpine AS builder
    WORKDIR /usr/src/app
    
    # Копируем файлы, которые нужны для установки зависимостей и сборки.
    COPY package*.json ./
    COPY prisma ./prisma
    
    # Устанавливаем все зависимости, генерируем клиент Prisma и собираем приложение.
    RUN npm ci
    RUN node ./node_modules/prisma/build/index.js generate
    COPY . .
    RUN npm run build
    
    # ---- Этап 2: продакшн ----
    FROM node:20-alpine
    WORKDIR /usr/src/app
    
    # Копируем собранные артефакты из предыдущего этапа.
    COPY --from=builder /usr/src/app/dist ./dist
    COPY --from=builder /usr/src/app/node_modules ./node_modules
    COPY --from=builder /usr/src/app/package*.json ./
    # Обязательно копируем папку prisma, чтобы клиент был доступен в runtime.
    COPY --from=builder /usr/src/app/prisma ./prisma
    
    ENV PORT=3000
    EXPOSE 3000
    
    CMD ["node", "dist/main.js"]