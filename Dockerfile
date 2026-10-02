FROM node:24-alpine AS dependencies
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com \
    && npm install --global pnpm@12.8.1 --no-audit --no-fund \
    && pnpm config set registry https://registry.npmmirror.com
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm build

FROM nginx:stable-alpine AS runner
ENV BACKEND_BASE_URL=http://backend:8081
COPY --from=builder /app/out /usr/share/nginx/html
COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
