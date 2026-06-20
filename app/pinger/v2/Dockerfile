# Use a lightweight Node image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json first for npm install
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code (index.js, pinger.js, etc.)
COPY . .

# Expose the main port for the app
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]
