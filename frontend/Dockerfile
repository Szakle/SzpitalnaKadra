# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate build timestamp (append on new line)
RUN echo "" >> .env.production && echo "REACT_APP_BUILD_VERSION=$(date '+%d.%m.%Y, %H:%M')" >> .env.production

# Build the app (uses .env.production automatically)
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS runtime

# Copy built files to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]