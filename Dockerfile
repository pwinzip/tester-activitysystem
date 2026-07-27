# SciDI Activity Check-in — single image (Next.js app + Prisma).
# Keeps dev dependencies so students can run migrations, seeds, and tests
# inside the container (docker compose exec web ...).
FROM node:22-alpine

WORKDIR /app
RUN apk add --no-cache openssl bash

# Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# App source
COPY . .

# Build-time placeholders (real values are injected at runtime by compose).
# These only need to be VALID in shape so env validation passes during build.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV BETTER_AUTH_SECRET="build-time-placeholder-secret-please-change-32chars"
ENV BETTER_AUTH_URL="http://localhost:3000"
ENV PUBLIC_APP_URL="http://localhost:3000"
ENV OTP_HASH_PEPPER="build-time-pepper"

RUN npx prisma generate && npm run build

EXPOSE 3000
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
