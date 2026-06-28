FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install
COPY . ./
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/dist ./dist
RUN npm ci --only=production || npm install --production
CMD ["node", "dist/main.js"]
