#!/usr/bin/env bash
cd "$(dirname "$0")/../.."
exec node tools/scraper/download-images.mjs --concurrency 14
