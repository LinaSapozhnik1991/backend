# ---- Этап 1: сборка ----
    FROM node:20-alpine AS builder
    WORKDIR /usr/src/app
    
    # Копируем prisma отдельно, чтобы была доступна схема для генерации клиента
    COPY prisma ./prisma
    COPY package*.json ./
    COPY tsconfig*.json ./
    
    # Устанавливаем зависимости (включая dev, т.к. нужны при сборке)
    RUN npm ci
    
    # Генерируем Prisma Client ПЕРЕД сборкой
    RUN npx prisma generate
    
    # Копируем исходный код
    COPY . .
    
    # Собираем приложение
    RUN npm run build
    
    # ---- Этап 2: продакшн ----
    FROM node:20-alpine
    WORKDIR /usr/src/app
    
    # Копируем собранный код и нужные зависимости из этапа builder
    COPY --from=builder /usr/src/app/dist ./dist
    COPY --from=builder /usr/src/app/node_modules ./node_modules
    COPY --from=builder /usr/src/app/package*.json ./
    COPY --from=builder /usr/src/app/prisma ./prisma
    
    # Делаем приложение доступным на порту, который ожидает Render
    ENV PORT=3000
    EXPOSE 3000
    
    # Запускаем приложение
    CMD ["node", "dist/main.js"]