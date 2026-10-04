FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY server.ts seo.ts ./
COPY frontend ./frontend
RUN npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/frontend/dist ./frontend/dist
USER node
EXPOSE 3000
CMD ["node", "frontend/dist/server.cjs"]
