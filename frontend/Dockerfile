FROM node:26-alpine

WORKDIR /app

RUN apk add --no-cache \
    libjpeg-turbo-dev \
    libpng-dev \
    make

COPY . .

RUN npm install

EXPOSE  5173
