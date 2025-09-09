#!/usr/bin/env bash
set -euo pipefail
ENV_NAME="${1:-staging}"

echo "[web-pwa] Deploying to $ENV_NAME"
# Ejemplo Vercel (si usas Vercel):
# npm i -g vercel
# if [ "$ENV_NAME" = "production" ]; then
#   vercel deploy --prebuilt --prod --cwd web-pwa
# else
#   vercel deploy --prebuilt --cwd web-pwa
# fi
echo "[web-pwa] (placeholder) Add your hosting commands (Vercel/Netlify/S3...)"
