FROM node:22-slim

WORKDIR /app

# Instalamos dependencias primero para aprovechar la caché de capas.
COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000

# --host 0.0.0.0 expone el dev server fuera del contenedor.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
