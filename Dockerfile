FROM node:18-alpine AS builder
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && CI=true npm run build

FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=builder /app/client/build ./client/build
EXPOSE 5000
CMD ["node", "server/index.js"]
