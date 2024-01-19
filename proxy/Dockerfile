FROM nginx

RUN [ "bash", "-c", "rm /etc/nginx/conf.d/default.conf;"]

COPY ./proxy.conf /etc/nginx/conf.d/

COPY ./image /home/data/image


WORKDIR /home
