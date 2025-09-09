#!/usr/bin/env bash
set -euo pipefail
ENV_NAME="${1:-staging}"

echo "[web-staff] Deploying to $ENV_NAME"
# Ejemplo Netlify/S3/otro provider...
echo "[web-staff] (placeholder) Add your hosting commands"
echo "::set-output name=url::https://preview-tu-app.example.com"