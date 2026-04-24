FROM node:22-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev 

COPY . .

RUN npx prisma generate

RUN npm run build 

EXPOSE 10000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]