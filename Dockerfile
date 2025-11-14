FROM node:18-slim

# Install Playwright dependencies and system utilities
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

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright Chromium (with system dependencies)
RUN npx playwright install --with-deps chromium

# Copy source code
COPY src ./src

# Create non-root user for security (Northflank best practice)
RUN groupadd -r pdfservice && useradd -r -g pdfservice pdfservice && \
    chown -R pdfservice:pdfservice /app

# Switch to non-root user
USER pdfservice

# Expose port (will be mapped by Northflank)
EXPOSE 3001

# Health check (Northflank uses its own health checks, but this is a fallback)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start the service
CMD ["npm", "start"]
