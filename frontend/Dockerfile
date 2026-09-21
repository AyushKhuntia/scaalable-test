# ---- Build stage: build the React app ----
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Runtime stage: nginx serves the static build and proxies /api ----
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

COPY --from=build /app/build .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
