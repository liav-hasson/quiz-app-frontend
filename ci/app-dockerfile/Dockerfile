# Build stage
FROM node:20-alpine AS build

# Accept build arguments
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_APP_VERSION=dev

# Set as environment variables for Vite build
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the app (Vite embeds VITE_* env vars at build time)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration (static serving only; API routing handled by gateway)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
