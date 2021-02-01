FROM node:lts-alpine as build

WORKDIR /app

COPY . .

RUN yarn && yarn build

FROM node:lts-alpine

WORKDIR /app

COPY --from=build /app /app

RUN apk add tzdata

EXPOSE 4002

ENV TZ=Asia/Jakarta

CMD ["yarn","start"]