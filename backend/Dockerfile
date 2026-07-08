FROM node:20-slim

# Install Chromium and necessary dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcups2 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using clean install for reliability
RUN npm ci

# Copy the rest of the backend source code
COPY . .

# Expose the port (Render uses the PORT env var dynamically, but good practice)
EXPOSE 3001

# Run the server directly, bypassing the --env-file flag in package.json start script
CMD ["node", "server.js"]
