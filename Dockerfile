FROM node:alpine as builder
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/ .bin:$PATH
COPY package.json /usr/src/app/package.json
RUN npm install --silent

COPY . /usr/src/app
RUN npm run build && rm -rf /usr/src/app/node_modules

# production environment
FROM nginx:1.17.3-alpine
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY default.conf /etc/nginx/conf.d/
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
