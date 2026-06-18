FROM node:20-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN mkdir -p /app/data

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./

COPY --from=frontend-build /frontend/dist /app/public

ENV SERVE_STATIC=true
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
