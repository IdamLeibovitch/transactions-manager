FROM node:24-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=
ARG VITE_SIGNALR_URL=/ws/transactions
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SIGNALR_URL=${VITE_SIGNALR_URL}

COPY src/client/package*.json ./
RUN npm ci

COPY src/client ./
RUN npm run build

FROM nginx:1.29-alpine AS runtime

COPY src/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
