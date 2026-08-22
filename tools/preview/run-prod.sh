#!/usr/bin/env bash
cd "$(dirname "$0")/../.."
exec node --env-file=.env.local node_modules/next/dist/bin/next start --port 3100
