FROM node:22-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Открываем порт (Vite по умолчанию использует 5173)
EXPOSE 5173

# Запускаем dev сервер с host 0.0.0.0 для работы в Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]