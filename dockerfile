# ---- Этап сборки ----
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    # Устанавливаем компилятор для bcrypt
    RUN apk add --no-cache python3 make g++
    
    COPY package*.json ./
    COPY prisma ./prisma
    
    # Устанавливаем зависимости
    RUN npm ci
    
    # Генерируем Prisma Client
    RUN npx prisma generate
    
    # Принудительно пересобираем bcrypt (если нужно)
    RUN npm rebuild bcrypt --build-from-source
    
    # Копируем остальной код и собираем TypeScript
    COPY . .
    RUN npm run build
    
    # ---- Финальный этап (только runtime) ----
    FROM node:20-alpine
    WORKDIR /app
    
    # Копируем только собранные файлы и зависимости из builder
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/prisma ./prisma
    
    # Запуск от непривилегированного пользователя (безопасность)
    RUN chown -R node:node /app
    USER node
    
    ENV PORT=3000
    EXPOSE 3000
    
    CMD ["node", "dist/main.js"]