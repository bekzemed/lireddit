FROM node:16

# Create app directory
WORKDIR /usr/src/app


COPY package*.json ./
COPY yarn.lock ./

RUN yarn

# Bundle app source
COPY . .
COPY .env.production .env

RUN yarn build


ENV NODE_ENV production

EXPOSE 4000
CMD [ "node", "dist/index.js" ]

USER node