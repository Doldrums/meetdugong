FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app
COPY web/package.json web/pnpm-lock.yaml ./web/
RUN cd web && pnpm install --frozen-lockfile
COPY web/ ./web/
RUN cd web && pnpm build:all

FROM node:22-slim
RUN corepack enable
WORKDIR /app
COPY --from=build /app/web/dist ./web/dist
COPY --from=build /app/web/dist-server ./web/dist-server
COPY web/package.json web/pnpm-lock.yaml ./web/
RUN cd web && pnpm install --frozen-lockfile --prod
COPY content/ ./content/
EXPOSE 8080
ENV PORT=8080
CMD ["node", "web/dist-server/index.mjs"]
