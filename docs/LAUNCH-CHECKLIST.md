# Launch Checklist

## Product Readiness

- [ ] Run `npm run verify:launch`
- [ ] Smoke test auth, household create/join, home dashboard, finances, chores, calendar, shopping, meals, supplies, maintenance, and rules
- [ ] Confirm the public web landing page loads for unauthenticated visitors
- [ ] Confirm the app still routes authenticated users into the app shell

## Environment

- [ ] Set `EXPO_PUBLIC_SUPABASE_URL`
- [ ] Set `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Set optional PostHog keys if analytics are enabled
- [ ] Verify Supabase Edge Functions are deployed for receipt, meal, pantry, and assistant flows

## Expo / EAS

- [ ] Configure bundle identifiers and package names in `app.json` or app config
- [ ] Confirm `com.jackeytsui.jollyhome` is the final iOS bundle identifier and Android package
- [ ] Attach the project to EAS if not already linked
- [ ] Run `eas build --platform ios --profile preview`
- [ ] Run `eas build --platform android --profile preview`
- [ ] Run production builds only after preview installs are validated

## Web

- [ ] Run `npm run build:web`
- [ ] Deploy the exported web build to the chosen host
- [ ] Verify deep links and invite links behave correctly from the deployed domain

## Store / Packaging

- [ ] Finalize app name, subtitle, description, keywords, and screenshots
- [ ] Prepare privacy policy and support contact
- [ ] Finalize store listing copy from `docs/STORE-LISTING.md`
- [ ] Verify icon, splash, favicon, and adaptive icon assets
- [ ] Review subscription/paywall copy if RevenueCat is enabled in production

## GitHub / Repo

- [ ] Confirm README reflects current product status
- [ ] Confirm issue templates and PR template are present
- [ ] Push the CI workflow once GitHub credentials have `workflow` scope
