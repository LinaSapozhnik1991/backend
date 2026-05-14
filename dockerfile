FROM node:20-alpine AS builder
WORKDIR /app

# Копируем package.json и prisma схему
COPY package*.json prisma/ ./

# Очищаем возможные старые бинарники и устанавливаем зависимости
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm ci && \
    npx prisma generate

# Копируем остальной код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Копируем собранное приложение и зависимости из builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Создаём непривилегированного пользователя
RUN chown -R node:node /app
USER node

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main.js"]