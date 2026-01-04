# OGAP – Community Parking Finder

OGAP is a React/TypeScript web app that helps drivers find and hand over parking spots in real time. It combines live location, Mapbox maps, Supabase realtime tables, and a credit-based handshake flow so users can share spots fairly. The project targets a university submission, so this README emphasizes setup, architecture, and evaluation notes.

## Table of Contents

- Overview
- Key Features
- Architecture
- Prerequisites
- Local Setup
- Environment Variables
- Supabase & Database
- Running and Quality Checks
- Mobile (Capacitor) Build Notes
- Deployment
- Project Structure
- User Journeys (for demo)

## Overview

- Use case: community-driven parking discovery and handover in urban areas.
- Core idea: drivers announce when they are leaving; others can claim the spot via a handshake flow and pay with in-app credits.
- Tech stack: Vite + React + TypeScript, Tailwind + shadcn/ui for UI, Supabase for auth/realtime/data, Mapbox GL for maps, Capacitor for native wrappers.

## Key Features

- Real-time parking spots: fetch and live-subscribe to `parking_spots` via Supabase realtime. Spots show availability and how long they have been free.
- Location-aware map: Mapbox map centers on the user and highlights nearby available spots; distance helper in the UI.
- Handshake flow: offer/request/accept/cancel/complete parking spot handovers (`handshake_deals`). Completion auto-starts a parking session for the receiver.
- Credits economy: balance display, credit transactions, and package listing; hooks to deduct/add credits on actions.
- Presence and stats: see active users and session timers; local persistence of a parking session to survive refreshes.
- Internationalization: language toggle (DE/EN) for landing and app copy.

## Architecture

- Frontend: React 18 with Vite; component library built on shadcn/ui (Radix primitives) and Tailwind.
- Data layer: Supabase JS client with typed schema; auth state is subscribed globally.
- Realtime: Postgres changes channels for `parking_spots` and `handshake_deals`.
- Maps: Mapbox GL initialized with a token fetched from a Supabase Edge Function (`mapbox-proxy`), with manual fallback input.
- State/helpers: custom hooks (`useCredits`, `useHandshake`, `usePresence`), `react-query` for data fetching, date-fns utilities, and localStorage persistence for parking sessions.
- Mobile: Capacitor project scaffolded for iOS/Android; web assets served from Vite build.

## Prerequisites

- Node.js 20+ and npm.
- Supabase project (for auth, tables, and edge functions).
- Mapbox account (for `MAPBOX_ACCESS_TOKEN`).
- Optional: Xcode / Android Studio if you want to run the Capacitor shells.

## Local Setup

1. Install dependencies

```sh
npm install
```

2. Configure environment

- Create `.env.local` (not committed) with Supabase credentials (see below).
- Make sure your Supabase project has the required tables; apply migrations if needed.

3. Start the app

```sh
npm run dev
# open the printed localhost URL
```

4. Lint (optional but recommended)

```sh
npm run lint
```

## Environment Variables

Create `.env.local` in the repo root:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

Mapbox token

- The app first tries to fetch a token via the Supabase Edge Function `mapbox-proxy` (see below). That function needs the secret `MAPBOX_ACCESS_TOKEN` set in Supabase.
- If the function is not configured, the UI falls back to a manual token input dialog and will cache it in `localStorage`.

## Supabase & Database

- Schema: tables include `parking_spots`, `handshake_deals`, `parking_history`, `credit_transactions`, `credit_packages`, and `profiles` (see `supabase/migrations`).
- Realtime: `parking_spots` updates are consumed on the map; `handshake_deals` updates trigger session handovers.
- Edge Functions: `supabase/functions/mapbox-proxy` proxies Mapbox and returns the token. Set the secret in your Supabase project:
  - `MAPBOX_ACCESS_TOKEN=<pk...>`
- Local Supabase (optional): with Supabase CLI installed, you can start functions locally:

```sh
supabase start
supabase functions serve mapbox-proxy --env-file supabase/.env
```

- Migrations: apply the SQL files in `supabase/migrations` to reproduce the schema. With the CLI: `supabase db reset` (destructive) or `supabase db push` depending on your workflow.

## Running and Quality Checks

- Dev server: `npm run dev`
- Production build: `npm run build` (outputs to `dist/`)
- Preview built app: `npm run preview`
- Lint: `npm run lint`

## Mobile (Capacitor) Build Notes

- Sync web build into native shells: `npm run build && npx cap sync`.
- iOS: open `ios/App/App.xcworkspace` in Xcode, set signing, then build/run on simulator or device.
- Android: install Android Studio, add the Android platform (`npx cap add android` if not added), then open the generated project to build/run.

## Deployment

- Live deployment: https://ogap.app
- Any static host works for the Vite build (e.g., Vercel, Netlify, Supabase Storage/Edge). Deploy the `dist/` folder.
- Ensure production env vars are set for Supabase URL/key and that Supabase Edge Functions are deployed with `MAPBOX_ACCESS_TOKEN` configured.

## Project Structure

- `src/pages`: main routes (`Landing`, `Index` app view, `Account`, `NotFound`).
- `src/components`: UI pieces including `Map`, dialogs, credit display, and handshake modals.
- `src/hooks`: domain hooks (`useCredits`, `useHandshake`, `usePresence`, `use-toast`).
- `src/integrations/supabase`: generated client and typed database schema.
- `src/lib`: helpers such as `parkingProbability` and distance utilities.
- `supabase/functions`: edge functions (notably `mapbox-proxy`).
- `supabase/migrations`: SQL migrations for database schema.
- `ios/`: Capacitor iOS project scaffold.

## User Journeys (for demo)

- Discover a spot: open `/app`, allow location, view nearby free spots with availability time and probability bar.
- Offer a spot: start a parking session, set leaving time, open leaving options, and publish a handshake deal.
- Claim a spot: pick a live handshake offer, request it, and receive the spot when the giver completes the handover; a parking session starts automatically.
- Manage account: visit `/account` to view parking history, credit balance/transactions, and update display name; language toggle available on the landing page.
