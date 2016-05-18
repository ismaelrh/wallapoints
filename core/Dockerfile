FROM node:4-onbuild

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
VOLUME ["/usr/src/app"]

# Install app dependencies
ADD . /usr/src/app

# expose port 8888
EXPOSE 8888

# node take docker mode for db connection
ENV NODE_ENV docker

CMD [ "node", "server.js" ]
