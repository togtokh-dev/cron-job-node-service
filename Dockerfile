FROM node:20-slim

RUN apt-get update && apt-get install -y git tzdata && rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Ulaanbaatar

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

EXPOSE 2003

ARG MODE
ENV MODE=$MODE

CMD npm run "$MODE"
