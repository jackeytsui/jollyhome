# Deployment Notes

## Local Verification

```bash
npm install
npm run verify:launch
```

## Web Export

```bash
npm run build:web
```

The Expo web export can then be deployed to the preferred static host.

## Expo Builds

Preview builds:

```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

Production builds:

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Submission

Once production builds are validated:

```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## Current Repo Constraint

The CI workflow file exists locally, but pushing `.github/workflows/ci.yml` currently requires a GitHub token with `workflow` scope. The rest of the launch scaffolding is already on `main`.
