FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the widget
RUN npm run build

# Install a simple HTTP server for serving static files
RUN npm install -g http-server

# Expose port
EXPOSE 8080

# Serve the built widget
CMD ["http-server", "dist", "-p", "8080", "--cors"]