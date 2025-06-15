FROM node:22.14.0-alpine

# create dir
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

# copy in docker executable from docker:dind image (so this image can run docker commands)
COPY --from=docker:dind /usr/local/bin/docker /bin/

# copy in source code and build dependencies
COPY --chown=node:node ./package*.json ./
COPY --chown=node:node ./src ./src
USER node
RUN npm install

# execute server
CMD [ "npm", "start" ]
