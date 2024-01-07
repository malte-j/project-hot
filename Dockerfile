# from ubuntu:22
FROM ubuntu:22.04

ENV NODE_ENV=production

WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY tsconfig.json .
COPY index.ts ./
RUN npm run build

ENV HOST=0.0.0.0
CMD ["node", "./dist/index"]