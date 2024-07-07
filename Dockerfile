FROM node:19.7.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g npm@9.5.0 && npm install

COPY . .

EXPOSE 3123

CMD [ "npm", "start" ]