FROM node:18-alpine

# Install dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies (ci for deterministic install)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Expose the API port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
