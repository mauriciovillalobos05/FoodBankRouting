#!/usr/bin/env bash
set -euo pipefail
ENV_NAME="${1:-staging}"

echo "[backend] Deploying to $ENV_NAME"
# Ejemplo: build & push a GHCR (ajusta a tu registry/plataforma)
# docker login "$REGISTRY" -u "$REGISTRY_USERNAME" -p "$REGISTRY_TOKEN"
# docker build -t "$REGISTRY/backend:$GITHUB_SHA" -f api/Dockerfile .
# docker push "$REGISTRY/backend:$GITHUB_SHA"
# fly deploy --image "$REGISTRY/backend:$GITHUB_SHA" --config fly.$ENV_NAME.toml
echo "[backend] (placeholder) Add your provider CLI commands here"