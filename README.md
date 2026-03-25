# Jolly Home

<p align="center">
  <img src="./assets/icon.png" alt="Jolly Home icon" width="120" />
</p>

<p align="center">
  A household operating system for shared living.
</p>

<p align="center">
  Split expenses. Manage chores. Plan meals. Coordinate calendars. Track supplies.
</p>

## Overview

Jolly Home is a cross-platform household management app built with Expo, React Native, and Supabase. It is designed for roommates, couples, families, and any shared living setup that wants one place to run the home instead of juggling Splitwise, OurHome, Cozi, notes apps, and group chats.

The product thesis is simple: shared living creates repeated coordination work around money, tasks, food, timing, and household rules. Jolly Home pulls those workflows into one connected system and layers AI on top where it actually removes friction.

## What It Covers

- Household creation, member invites, profiles, and solo-first onboarding
- Expense tracking with flexible splits, balances, settlements, and recurring expenses
- AI receipt OCR and natural-language expense parsing
- Chores, fairness, attendance, and a shared household calendar
- Shopping lists, pantry inventory, meal planning, and receipt-to-pantry workflows
- Future maintenance, house rules, notifications, dashboards, and assistant features

## Current Status

This repo now contains the full v1 household product milestone:

- Phase 1: Foundation + Household
- Phase 2: Expense Tracking + Receipt OCR
- Phase 3: Chores + Calendar
- Phase 4: Shopping + Meals + Supplies
- Phase 5: Maintenance + House Rules
- Phase 6: Intelligence + Polish

Current work has moved into launch readiness:

- public web entry
- deployment and CI scaffolding
- release hardening and QA
- app and GitHub packaging

## Tech Stack

- Expo + React Native
- TypeScript
- Expo Router
- Supabase
- Zustand
- Jest

## Local Development

```bash
npm install
npm test
npm run start
npm run web
```

Environment variables are documented in [.env.example](./.env.example).

For release builds, EAS is configured through [eas.json](./eas.json).

## Repository Readiness

- MIT licensed
- GitHub issue templates and PR template included
- CI workflow runs Jest on push and pull request
- Launch planning artifacts are committed alongside implementation

## Why This Repo Exists

Most tools for shared living solve one narrow problem well but create more fragmentation overall. Jolly Home is an attempt to build the unified layer instead:

- money and receipts
- chores and fairness
- calendars and attendance
- pantry, shopping, and meals
- eventually maintenance, rules, and household intelligence

## Roadmap Snapshot

- Phase 1: Foundation + Household
- Phase 2: Expense Tracking + Receipt OCR
- Phase 3: Chores + Calendar
- Phase 4: Shopping + Meals + Supplies
- Phase 5: Maintenance + House Rules
- Phase 6: Intelligence + Polish
- Phase 7: Launch Readiness

## Repository Notes

- This is the product repository, not a polished template.
- Planning artifacts are committed alongside implementation as part of the build workflow.
- The app is optimized around the housemate and family use case first.
- Web visitors now land on a public product page before auth.

## License

MIT
