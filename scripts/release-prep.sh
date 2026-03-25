#!/usr/bin/env bash
set -euo pipefail

SKIP_ENV_CHECK="${1:-}"

echo "==> Verifying launch gate"
npm run verify:launch

if [[ "${SKIP_ENV_CHECK}" != "--skip-env" ]]; then
  echo "==> Checking required environment variables"
  : "${EXPO_PUBLIC_SUPABASE_URL:?Missing EXPO_PUBLIC_SUPABASE_URL}"
  : "${EXPO_PUBLIC_SUPABASE_ANON_KEY:?Missing EXPO_PUBLIC_SUPABASE_ANON_KEY}"
else
  echo "==> Skipping environment validation"
fi

echo "==> Checking launch docs"
test -f docs/LAUNCH-CHECKLIST.md
test -f docs/DEPLOYMENT.md
test -f docs/STORE-LISTING.md
test -f LICENSE
test -f eas.json

echo "==> Release prep complete"
echo "Next:"
echo "  1. npm run build:web"
echo "  2. eas build --platform ios --profile preview"
echo "  3. eas build --platform android --profile preview"
