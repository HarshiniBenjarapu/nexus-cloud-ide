# Production Dockerfile for Nexus Cloud IDE Backend
FROM node:22-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source code
COPY backend/ ./

# Build TypeScript to dist/
RUN npm run build

# Expose HTTP & WebSocket port
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Start production server
CMD ["npm", "start"]
