# Use official Node.js 20 lightweight Alpine Linux image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package manifests first for efficient Docker layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source code and initial data files
COPY src/ ./src/
COPY data/ ./data/

# Ensure data directory exists for state persistence
RUN mkdir -p /app/data

# Environment variable defaults
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Command to start the Telegram bot
CMD ["node", "src/index.js"]
