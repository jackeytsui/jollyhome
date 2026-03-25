# Deployment Notes

## Local Verification

```bash
npm install
npm run verify:launch
bash scripts/release-prep.sh --skip-env
```

## Web Export

```bash
npm run build:web
```

The Expo web export can then be deployed to the preferred static host.

## Expo Builds

Preview builds:

```bash
npm run build:ios:preview
npm run build:android:preview
```

Production builds:

```bash
npm run build:ios:prod
npm run build:android:prod
```

## Submission

Once production builds are validated:

```bash
npm run submit:ios
npm run submit:android
```

## Current Repo Constraint

The CI workflow file exists locally, but pushing `.github/workflows/ci.yml` currently requires a GitHub token with `workflow` scope. The rest of the launch scaffolding is already on `main`.
