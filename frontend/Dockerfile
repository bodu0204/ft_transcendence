FROM node:20.11

COPY ./app /home/app

WORKDIR /home/app

RUN [ "npm", "install" ]

RUN [ "npm","run","build" ]

CMD [ "npm", "start" ]