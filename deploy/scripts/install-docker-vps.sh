#!/bin/bash
# Instala Docker Engine + Compose plugin na VPS (Debian/Ubuntu).
# Uso: bash deploy/scripts/install-docker-vps.sh
set -euo pipefail

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "Docker e Compose já instalados:"
  docker --version
  docker compose version
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Execute como root (ou com sudo)."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Pacotes base..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg

echo "==> Repositório oficial Docker..."
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

. /etc/os-release
CODENAME="${VERSION_CODENAME:-jammy}"
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker

echo "==> OK"
docker --version
docker compose version
echo ""
echo "Próximo passo:"
echo "  cd /var/www/universidade/repo"
echo "  bash deploy/scripts/issue-ssl-certs.sh prod"
