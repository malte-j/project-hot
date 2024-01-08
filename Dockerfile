# from ubuntu:22
FROM node:20

ENV NODE_ENV=production
RUN npm i -g pnpm
RUN apt update
RUN apt install -y imagemagick

WORKDIR /app

COPY web/package.json web/pnpm-lock.yaml ./
COPY web/prisma ./prisma
RUN pnpm i

COPY web/tsconfig.json .
COPY web/src/ ./src
RUN npm run b

ENV HOST=0.0.0.0
ENV PORT=80
CMD ["node", "./dist/src/index"]