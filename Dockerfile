# CineFlux OAuth Server
# Node.js + Express backend with Google OAuth 2.0
# Serves static frontend files from dist/

FROM node:20-alpine

WORKDIR /app

# Install PM2
RUN npm install -g pm2

# Copy package files
COPY package.json ./
COPY package-lock.json ./

# Copy server and built frontend
COPY server.cjs ./
COPY dist ./dist

# Install production dependencies
RUN npm install --only=production --omit=dev

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["pm2-runtime", "server.cjs", "--name", "cineflux-api", "--instances", "1"]
