# =========================
# 1. BUILD STAGE
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build


# =========================
# 2. PRODUCTION STAGE
# =========================
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

# copy only compiled output from build stage
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/server/index.js"]