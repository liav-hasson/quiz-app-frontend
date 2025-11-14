# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration with backend proxy
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Set default backend URL (can be overridden by environment variable)
ENV BACKEND_URL=backend:5000

EXPOSE 80

# nginx will automatically substitute ${BACKEND_URL} in template files
CMD ["nginx", "-g", "daemon off;"]
