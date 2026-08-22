#!/usr/bin/env bash
cd "$(dirname "$0")/../.."
exec pnpm dev --port 3000
