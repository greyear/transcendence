# Auth Service Dockerfile
#
# Builds a production-ready Docker image for the auth service:
# 1. Installs dependencies (including TypeScript)
# 2. Compiles TypeScript to JavaScript (npm run build)
# 3. Runs the compiled code (npm start)

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY index.ts ./
COPY src ./src

# Build TypeScript
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]
