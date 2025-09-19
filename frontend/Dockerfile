# Stage 1: Install dependencies
FROM node:21.5.0 AS base
# Sử dụng Node LTS

# Đặt thư mục làm việc
WORKDIR /app

# Fix HOME cho npm (tránh lỗi /nonexistent)
ENV HOME=/app
ENV NPM_CONFIG_CACHE=/app/.npm

# Copy file package trước để cache dependencies
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ code
COPY . .

# Build Next app
RUN npm run build

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
