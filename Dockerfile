FROM node:4.5.0

# create /app directory
RUN mkdir /app
WORKDIR /app
VOLUME /app

RUN npm install -g bower

CMD ["node"]

