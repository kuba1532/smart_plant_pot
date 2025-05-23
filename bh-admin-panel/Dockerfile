# ---- Base Node Stage ----
    FROM node:20-alpine AS base
    WORKDIR /app
    ENV NEXT_TELEMETRY_DISABLED 1
    
    # ---- Dependencies Stage ----
    FROM base AS deps
    WORKDIR /app
    
    COPY package.json package-lock.json* ./
    # If you use yarn, copy yarn.lock and use `RUN yarn install --frozen-lockfile`
    # If you use pnpm, copy pnpm-lock.yaml and use `RUN pnpm install --frozen-lockfile`
    RUN npm install --frozen-lockfile
    
    # ---- Builder Stage ----
    FROM base AS builder
    WORKDIR /app
    
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    
    # Build-time arguments for NEXT_PUBLIC_ variables
    ARG NEXT_PUBLIC_API_URL
    ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
    ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
    ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
    ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
    
    # Set environment variables for the build process
    ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_URL}
    ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_URL}
    ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
    ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
    ENV NODE_ENV production
    
    RUN npm run build
    
    # ---- Runner Stage ----
    FROM base AS runner
    WORKDIR /app
    
    ENV NODE_ENV production
    # Runtime Environment Variables (will be set by `docker run -e`)
    # ENV CLERK_SECRET_KEY
    # ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    # ENV NEXT_PUBLIC_API_URL
    # ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL
    # ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL
    # ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
    # ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
    
    RUN addgroup --system --gid 1001 nodejs
    RUN adduser --system --uid 1001 nextjs
    
    COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
    COPY --from=builder --chown=nextjs:nodejs /app/public ./public
    COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
    
    USER nextjs
    EXPOSE 3000
    ENV PORT 3000
    
    CMD ["node", "server.js"]