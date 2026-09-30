# ============================================================
# Stage 1: Dependencies (cached layer)
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Install build tools for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci --only=production && cp -r node_modules /tmp/prod_modules
RUN npm ci


# ============================================================
# Stage 2: Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


# ============================================================
# Stage 3: Development (live reload via nodemon)
# ============================================================
FROM node:20-alpine AS development

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S eduk8u -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p logs && chown -R eduk8u:nodejs logs

USER eduk8u

EXPOSE 3000

CMD ["npm", "run", "dev"]


# ============================================================
# Stage 4: Production (minimal image)
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Security: run as non-root
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
RUN addgroup -g 1001 -S nodejs && adduser -S eduk8u -u 1001

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy only production node_modules and built output
COPY --from=deps --chown=eduk8u:nodejs /tmp/prod_modules ./node_modules
COPY --from=builder --chown=eduk8u:nodejs /app/dist ./dist
COPY --chown=eduk8u:nodejs package.json ./

RUN mkdir -p logs && chown eduk8u:nodejs logs

USER eduk8u

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 3000

CMD ["node", "dist/server.js"]
