FROM node:22-alpine

WORKDIR /frontend

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 8091

CMD ["npm", "run", "dev"]
