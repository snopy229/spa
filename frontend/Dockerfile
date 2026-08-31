FROM node:26-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg-dev \
    libpng-dev \
    make \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json .

RUN npm install

COPY . .

EXPOSE  5173
