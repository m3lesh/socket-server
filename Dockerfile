

FROM node:19-alpine as base

FROM base as development
WORKDIR /app
COPY  package.json .
RUN npm install
COPY . .
# ENV PORT=3000
EXPOSE 3000
CMD [ "npm","run","start-dev" ]

FROM base as production
WORKDIR /app
COPY  package.json .
RUN npm install --only=production
COPY . .
# ENV PORT=3000
EXPOSE 3000
CMD [ "npm","start" ]