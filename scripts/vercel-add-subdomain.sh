#!/usr/bin/env bash
set -euo pipefail

# Adds a subdomain under a Vercel-managed domain using the Vercel CLI.
# Requires VERCEL_TOKEN or an interactive login (not ideal for CI).
#
# Examples:
#   VERCEL_TOKEN=xxxxx ./scripts/vercel-add-subdomain.sh --domain gencapp.pro --sub api
#   VERCEL_TOKEN=xxxxx ./scripts/vercel-add-subdomain.sh --domain gencapp.pro --sub api --target cname.vercel-dns.com
#
# If --target is omitted, a CNAME to cname.vercel-dns.com is created so
# you can alias a Vercel deployment (vercel alias set <url> api.gencapp.pro).

DOMAIN=""
SUB=""
TARGET="cname.vercel-dns.com"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="$2"; shift 2 ;;
    --sub|--name)
      SUB="$2"; shift 2 ;;
    --target)
      TARGET="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 --domain <apex> --sub <host> [--target <cname_target>]"; exit 0 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "${DOMAIN}" || -z "${SUB}" ]]; then
  echo "Missing required args. Usage: $0 --domain <apex> --sub <host> [--target <cname_target>]" >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI not found; using npx vercel" >&2
  VER="npx vercel"
else
  VER="vercel"
fi

TOKEN_ARG=${VERCEL_TOKEN:+"-t ${VERCEL_TOKEN}"}

echo "Inspecting domain ${DOMAIN}..."
if ! ${VER} domains inspect ${TOKEN_ARG:-} "${DOMAIN}" >/dev/null 2>&1; then
  echo "Adding apex domain ${DOMAIN} to Vercel..."
  ${VER} domains add ${TOKEN_ARG:-} "${DOMAIN}"
fi

echo "Creating CNAME for ${SUB}.${DOMAIN} -> ${TARGET}"
${VER} dns add ${TOKEN_ARG:-} "${DOMAIN}" CNAME "${SUB}" "${TARGET}"

echo "Done. Propagation may take a few minutes. Verify with:"
echo "  dig +short ${SUB}.${DOMAIN} CNAME"
echo "  curl -I https://${SUB}.${DOMAIN}/health (once backend/alias is configured)"

