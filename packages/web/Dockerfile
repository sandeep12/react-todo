FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

COPY package.json ./
COPY packages/web/package.json packages/web/
RUN npm install --workspace=@todo/web --include-workspace-root=false

COPY packages/web packages/web
RUN npm run build -w @todo/web

FROM node:20-alpine AS runtime

WORKDIR /app

COPY package.json ./
COPY packages/web/package.json packages/web/
RUN npm install --workspace=@todo/web --include-workspace-root=false --omit=dev

COPY --from=build /app/packages/web/dist packages/web/dist

WORKDIR /app/packages/web
EXPOSE 4173
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "4173"]
