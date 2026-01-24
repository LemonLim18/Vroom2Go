# Build Stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# params
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_GEMINI_API_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Build the app used by Nginx
RUN npm run build

# Serve Stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
