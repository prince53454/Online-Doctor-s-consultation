FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci --workspace=client --include-workspace-root=false
COPY client/ ./client/
RUN npm run build --workspace=client

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci --workspace=server --include-workspace-root=false --omit=dev && npm cache clean --force
COPY --chown=node:node server/ ./server/
COPY --chown=node:node --from=builder /app/client/build ./client/build
RUN mkdir -p /app/server/storage/uploads && chown -R node:node /app/server/storage /app/client/build
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server/src/index.js"]
