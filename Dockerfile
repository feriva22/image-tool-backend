FROM node:lts-alpine as build

WORKDIR /app

COPY . .

ADD .env.production .env

RUN yarn && yarn build

FROM node:lts-alpine

WORKDIR /app

COPY --from=build /app /app

RUN apk add tzdata

EXPOSE 80

ENV TZ=Asia/Jakarta

CMD ["yarn","start"]