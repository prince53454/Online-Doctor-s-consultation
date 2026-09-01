FROM node:20-slim

# Install MongoDB
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg && \
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && apt-get install -y mongodb-org && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy server dependencies first for caching
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy client dependencies and build
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy all source code
COPY . .

# Build client
RUN cd client && CI=true npm run build

# Seed database on startup
COPY server/seeds/seed.js ./server/seeds/seed.js

# Create startup script
RUN echo '#!/bin/bash\n\
mkdir -p /data/db\n\
mongod --dbpath /data/db --fork --logpath /var/log/mongod.log &&\n\
echo "Waiting for MongoDB..." &&\n\
sleep 3 &&\n\
cd /app/server && node seeds/seed.js &&\n\
echo "Starting server..." &&\n\
PORT=7860 node index.js\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 7860

ENV PORT=7860
ENV MONGODB_URI=mongodb://localhost:27017/mediconnect_pro
ENV JWT_SECRET=mediconnect_hf_secret_2024
ENV JWT_EXPIRE=30d
ENV NODE_ENV=production
ENV CLIENT_URL=http://localhost:7860

CMD ["/app/start.sh"]
