FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

FROM node:22-slim

LABEL org.opencontainers.image.title="Blumira MCP Server"
LABEL org.opencontainers.image.description="MCP server for the Blumira Public API"

ENV NODE_ENV=production

RUN useradd -m -u 1000 -s /sbin/nologin mcp

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev

COPY --from=builder --chown=mcp:mcp /app/dist ./dist

USER mcp

ENTRYPOINT ["node", "dist/index.js"]
