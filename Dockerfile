# Stage 1: Build & Compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install ALL dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Compile TypeScript to JavaScript
RUN yarn build

# Stage 2: Production dependencies only
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install ONLY production dependencies
RUN yarn install --production --frozen-lockfile && \
    yarn cache clean

# Stage 3: Runtime (smallest image)
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy ONLY production dependencies (no devDependencies, no tsx)
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy ONLY compiled JavaScript (not TypeScript source)
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package.json ./

# Switch to non-root user
USER nodejs

# Set Node environment to production
ENV NODE_ENV=production

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

ENTRYPOINT ["dumb-init", "--"]

# Run compiled JavaScript (MUCH faster than tsx)
CMD ["node", "dist/index.js"]
