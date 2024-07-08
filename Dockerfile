FROM node:20-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y tzdata
ENV TZ=Asia/Ulaanbaatar

WORKDIR /app

RUN apt-get update && apt-get install -y git

RUN npm cache clean --force

COPY . .

RUN npm install

RUN npm run build

EXPOSE 2003

ARG MODE
ENV MODE=$MODE

CMD npm run "$MODE"
