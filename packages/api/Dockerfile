FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
COPY packages/api/package.json packages/api/
RUN npm install --workspace=@todo/api --include-workspace-root=false

COPY packages/api packages/api
RUN npm run build -w @todo/api

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY packages/api/package.json packages/api/
RUN npm install --workspace=@todo/api --include-workspace-root=false --omit=dev

COPY --from=build /app/packages/api/dist packages/api/dist

WORKDIR /app/packages/api
EXPOSE 3000
CMD ["node", "dist/index.js"]
