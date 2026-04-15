#!/bin/bash

set -e

if [ -f "certs/cert.pem" ] && [ -f "certs/key.pem" ]; then
    echo "Certificates already exist, skipping generation"
    echo "Note: if you need to regenerate, run: rm -rf certs/ && make certs"
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

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Trusting certificate in macOS keychain..."
    security add-trusted-cert -d -r trustRoot \
        -k ~/Library/Keychains/login.keychain \
        certs/cert.pem
    echo "✓ Certificate trusted — restart your browser to apply"
fi