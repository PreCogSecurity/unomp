# UNOMP Dockerfile
# Multi-stage build for production-ready image

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Remove development files
RUN rm -rf tests .github .eslintrc.json jest.config.js .env.example Dockerfile docker-compose.yml

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1000 -S unomp && \
    adduser -u 1000 -S unomp -G unomp

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=unomp:unomp /app .

# Create directories for config and logs
RUN mkdir -p /app/config /app/logs && \
    chown -R unomp:unomp /app

# Switch to non-root user
USER unomp

# Expose ports
# Website port (configurable via env)
EXPOSE 80
# Stratum ports (configured per pool)
# CLI port
EXPOSE 17117

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${WEBSITE_PORT:-80}/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "init.js"]