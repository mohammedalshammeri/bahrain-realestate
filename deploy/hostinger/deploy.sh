#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/bahrain-realestate-backend"
ADMIN_DIR="$ROOT_DIR/bahrain-realestate-frontend-admin-dashboard"
ECOSYSTEM_FILE="$ROOT_DIR/deploy/hostinger/ecosystem.config.js"

detect_package_manager() {
	local app_dir="$1"

	if [[ -f "$app_dir/pnpm-lock.yaml" ]]; then
		echo "pnpm"
		return
	fi

	if [[ -f "$app_dir/package-lock.json" ]]; then
		echo "npm"
		return
	fi

	echo "npm"
}

run_install() {
	local app_dir="$1"
	local manager

	manager="$(detect_package_manager "$app_dir")"

	if [[ "$manager" == "pnpm" ]]; then
		command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required for $app_dir"; exit 1; }
		pnpm install --frozen-lockfile
		return
	fi

	npm ci
}

run_script() {
	local app_dir="$1"
	local script_name="$2"
	local manager

	manager="$(detect_package_manager "$app_dir")"

	if [[ "$manager" == "pnpm" ]]; then
		pnpm run "$script_name"
		return
	fi

	npm run "$script_name"
}

echo "[1/7] Checking required commands"
command -v node >/dev/null 2>&1 || { echo "node is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "pm2 is required"; exit 1; }

echo "[2/7] Installing backend dependencies"
cd "$BACKEND_DIR"
run_install "$BACKEND_DIR"

echo "[3/7] Installing admin dependencies"
cd "$ADMIN_DIR"
run_install "$ADMIN_DIR"

echo "[4/7] Building backend"
cd "$BACKEND_DIR"
run_script "$BACKEND_DIR" build

echo "[5/7] Applying Prisma migrations"
npx prisma migrate deploy

echo "[6/7] Building admin"
cd "$ADMIN_DIR"
run_script "$ADMIN_DIR" build

echo "[7/7] Starting services with PM2"
cd "$ROOT_DIR"
pm2 start "$ECOSYSTEM_FILE"
pm2 save

echo "Deployment completed. Verify nginx, SSL, env files, SMTP, and AFS before public launch."