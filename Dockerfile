FROM node:20-slim
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY . .
RUN cd client && CI=true npm run build
EXPOSE 5000
ENV PORT=5000
CMD ["sh", "-c", "cd server && node index.js"]
