FROM node:18-slim

# Set memory limits for Node.js
ENV NODE_OPTIONS="--max-old-space-size=512 --expose-gc"
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Install Playwright dependencies (Railway.com optimized)
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libxshmfence1 \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright Chromium with all dependencies
RUN npx playwright install --with-deps chromium

# Copy source code
COPY src ./src

# Railway automatically handles PORT env variable
EXPOSE 3001

# Health check (optimized interval to reduce CPU usage)
HEALTHCHECK --interval=60s --timeout=5s --start-period=15s --retries=2 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start the service
CMD ["npm", "start"]
