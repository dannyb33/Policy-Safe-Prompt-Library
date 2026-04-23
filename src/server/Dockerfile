FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build tools available (tsx runs directly, no build step needed)
EXPOSE 4000

# Run your dev server
CMD ["npm", "run", "dev:server"]