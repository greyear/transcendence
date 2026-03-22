FROM node:20-alpine

WORKDIR /app

# Install MongoDB.
# Add repos, install daemon and utilities, start service
RUN \
	apk update \
	echo 'http://dl-cdn.alpinelinux.org/alpine/v3.9/main' >> /etc/apk/repositories \
	echo 'http://dl-cdn.alpinelinux.org/alpine/v3.9/community' >> /etc/apk/repositories \
	apk add mongodb mongodb-tools \
	rc-update add mongodb default

# Define default command.
CMD ["mongod"]

# Expose ports.
#   - 27017: process
EXPOSE 27017