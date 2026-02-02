FROM node:20-alpine

WORKDIR /app

# Minimal stub service
RUN echo '{"name":"auth-service","version":"0.1.0","type":"module","main":"index.js"}' > package.json
RUN echo 'import http from "http"; http.createServer((req,res)=>res.end("auth-service stub")).listen(3001);' > index.js

EXPOSE 3001

CMD ["node", "index.js"]