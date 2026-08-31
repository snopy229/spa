FROM node:26-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg-dev \
    libpng-dev \
    make \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install

EXPOSE  5173
