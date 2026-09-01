# ── Build Stage ──────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app/client

# Install client deps and build
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Production Stage ─────────────────────
FROM node:20-alpine

WORKDIR /app

# Install server deps
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy server code
COPY server/ ./

# Copy built React app to the path server expects: ../client/build
RUN mkdir -p /client
COPY --from=builder /app/client/build /client/build

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]
