FROM node:20-alpine

WORKDIR /app

# Minimal stub service
RUN echo '{"name":"notification-service","version":"0.1.0","type":"module","main":"index.js"}' > package.json
RUN echo 'import http from "http"; http.createServer((req,res)=>res.end("notification-service stub")).listen(3003);' > index.js

EXPOSE 3003

CMD ["node", "index.js"]