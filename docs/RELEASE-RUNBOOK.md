# Release Runbook

## 1. Local prep

```bash
npm install
bash scripts/release-prep.sh
```

If local env vars are not loaded yet, use:

```bash
bash scripts/release-prep.sh --skip-env
```

## 2. Web

```bash
npm run build:web
```

Deploy the exported web output to the chosen static host and verify:

- landing page loads unauthenticated
- auth routes still work
- invite links still resolve correctly

## 3. Preview builds

```bash
npm run build:ios:preview
npm run build:android:preview
```

Validate the preview installs before production builds.

## 4. Production builds

```bash
npm run build:ios:prod
npm run build:android:prod
```

## 5. Submission

```bash
npm run submit:ios
npm run submit:android
```

## 6. Remaining external blockers

- GitHub workflow publishing still requires credentials with `workflow` scope for `.github/workflows/ci.yml`
- Store credentials, privacy policy URL, and support email still need to be finalized in the target accounts
