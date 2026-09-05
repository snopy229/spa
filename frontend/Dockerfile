FROM node:26-alpine

WORKDIR /app

RUN apk add --no-cache \
    libjpeg-turbo-dev \
    libpng-dev \
    make

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE  5173
