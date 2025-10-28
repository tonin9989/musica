FROM node:18-alpine

WORKDIR /app

# copy package manifests first for better layer caching
COPY package*.json ./

# install deps (including dev for build)
RUN npm ci --legacy-peer-deps --no-audit --progress=false

# copy source
COPY . .

# build frontend
RUN npm run build --if-present

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/index.js"]
