FROM node:24-alpine AS development-dependencies-env
COPY . /app/
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:24-alpine AS build-env
COPY . /app/
RUN rm -f /app/.env /app/.env.local
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
# docker.env.local is optional; in Coolify the values come from build args
COPY .env docker.env.local* /app/
WORKDIR /app
RUN if [ -f docker.env.local ]; then mv docker.env.local .env.local; fi
ARG VITE_CG_DATA_REFRESH_INTERVAL
ARG VITE_AIRDROP_REFRESH_INTERVAL
ARG VITE_PLUGIN_PUBLIC_KEY
ARG VITE_URL_PREFIX
RUN npx hardhat compile --force --config /app/contracts/hardhat.config.cjs && \
    npx hardhat run --config /app/contracts/hardhat.config.cjs /app/contracts/scripts/generate-verification-data.ts
RUN npm run prisma:generate
RUN npm run build

FROM node:24-alpine
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
COPY --from=build-env /app/prisma /app/prisma
COPY --from=build-env /app/generated /app/generated
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY --from=build-env /app/.env* /app/
WORKDIR /app
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]