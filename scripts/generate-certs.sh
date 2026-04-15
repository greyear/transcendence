#!/bin/bash

set -e

if [ -f "certs/cert.pem" ] && [ -f "certs/key.pem" ]; then
    echo "Certificates already exist, skipping generation"
    exit 0
fi

echo "Generating self-signed certificates..."

mkdir -p certs

openssl req -x509 -newkey rsa:4096 \
    -keyout certs/key.pem \
    -out certs/cert.pem \
    -days 365 -nodes \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "✓ Certificates generated successfully"
