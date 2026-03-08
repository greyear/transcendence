# API Gateway Dockerfile
# 
# Builds a production-ready Docker image for the API gateway:
# 1. Installs dependencies (including TypeScript)
# 2. Compiles TypeScript to JavaScript (npm run build)
# 3. Runs the compiled code (npm start)

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]