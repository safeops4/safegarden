FROM node:20-alpine

WORKDIR /app

RUN mkdir -p /app/data

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./

EXPOSE 5000

CMD ["node", "server.js"]
