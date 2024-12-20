# Build stage
FROM node:20 AS builder

# Set working directory
WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies and rebuild sqlite3
RUN npm ci && \
    npm rebuild sqlite3 && \
    npm cache clean --force

# Copy application code
COPY . .

# Final stage
FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Create a non-root user
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser

# Copy built node modules and application code from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=nodeuser:nodeuser . .

# Set secure permissions
RUN chown -R nodeuser:nodeuser /usr/src/app

# Switch to non-root user
USER nodeuser

# Add security headers
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn \
    NODE_OPTIONS='--max-old-space-size=2048' \
    SECURITY_HEADERS='{"X-Frame-Options":"SAMEORIGIN","X-XSS-Protection":"1; mode=block","X-Content-Type-Options":"nosniff"}'

# Expose the port the app runs on
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
CMD curl -f http://localhost:3000/health || exit 1

# Run the web service on container startup
CMD ["npm", "start"]
