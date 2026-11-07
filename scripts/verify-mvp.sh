#!/usr/bin/env bash
# Smoke verify Phase 5–6 against running BO + Web.
# Usage:
#   WEB_URL=http://localhost:3001 BO_URL=http://localhost:3000 bash scripts/verify-mvp.sh
set -euo pipefail

WEB_URL="${WEB_URL:-http://localhost:3001}"
BO_URL="${BO_URL:-http://localhost:3000}"
SECRET="${REVALIDATE_SECRET:-}"

ok=0
fail=0

check() {
  local name="$1"
  local url="$2"
  local expect="${3:-200}"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$url" || true)"
  if [[ "$code" == "$expect" ]]; then
    echo "OK  $name ($code) $url"
    ok=$((ok + 1))
  else
    echo "FAIL $name (got $code, want $expect) $url"
    fail=$((fail + 1))
  fi
}

echo "== Public web =="
check "home" "$WEB_URL/"
check "robots" "$WEB_URL/robots.txt"
check "sitemap" "$WEB_URL/sitemap.xml"
check "llms" "$WEB_URL/llms.txt"
check "contact page" "$WEB_URL/contact"
check "documents list" "$WEB_URL/documents"
check "services list" "$WEB_URL/services"
check "projects list" "$WEB_URL/projects"
check "news list" "$WEB_URL/news"

# Draft document path must not be public via /uploads/documents
code="$(curl -sS -o /dev/null -w '%{http_code}' "$WEB_URL/uploads/documents/does-not-exist.pdf" || true)"
if [[ "$code" == "403" || "$code" == "404" ]]; then
  echo "OK  uploads/documents blocked or missing ($code)"
  ok=$((ok + 1))
else
  echo "FAIL uploads/documents unexpected ($code) — expect 403/404"
  fail=$((fail + 1))
fi

echo "== BO =="
check "login page" "$BO_URL/login"

if [[ -n "$SECRET" ]]; then
  echo "== Revalidate =="
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$WEB_URL/api/revalidate" \
    -H 'Content-Type: application/json' \
    -d "{\"secret\":\"$SECRET\",\"tags\":[\"web:sitemap\"]}" || true)"
  if [[ "$code" == "200" ]]; then
    echo "OK  revalidate with secret ($code)"
    ok=$((ok + 1))
  else
    echo "FAIL revalidate ($code)"
    fail=$((fail + 1))
  fi
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$WEB_URL/api/revalidate" \
    -H 'Content-Type: application/json' \
    -d '{"secret":"wrong","tags":["web:sitemap"]}' || true)"
  if [[ "$code" == "401" ]]; then
    echo "OK  revalidate rejects bad secret ($code)"
    ok=$((ok + 1))
  else
    echo "FAIL revalidate bad secret (got $code, want 401)"
    fail=$((fail + 1))
  fi
else
  echo "SKIP revalidate checks (set REVALIDATE_SECRET)"
fi

echo
echo "Passed: $ok  Failed: $fail"
[[ "$fail" -eq 0 ]]
