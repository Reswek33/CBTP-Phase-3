FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# 3. Copy source code
COPY . .

RUN npx prisma generate

RUN npm run build 

RUN npm prune --omit=dev

EXPOSE 10000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]