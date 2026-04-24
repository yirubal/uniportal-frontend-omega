# Codex Project Context

This file is the durable handoff for future Codex sessions working in this repository.

## How To Use

- Read this file and `PROJECT.md` first at the start of a new session.
- Update this file after meaningful decisions, architecture changes, or branch changes.
- Keep entries short and factual.
- Do not store secrets, tokens, or personal data here.

## Project Snapshot

- Repo: `uniportal-frontend`
- Current working branch for active work: `dev`
- App type: Telegram Mini App for Unity University Ethiopia students
- Frontend stack: React 19, Vite 7, TypeScript, Tailwind CSS v4, Zustand, React Router v7, Axios
- Telegram integration: `@twa-dev/sdk`
- PDF support: `react-pdf`

## Actual Codebase Status

- The codebase is ahead of `PROJECT.md` in some areas.
- `PROJECT.md` says many screens are still todo, but the screens already exist under `src/screens/`.
- Core routing, auth flow, stores, hooks, API clients, and several polished UI screens are already implemented.
- Development mode includes API fallback mocks in `src/api/devMocks.ts`.

## Current Architecture Notes

- `src/main.tsx` initializes Telegram WebApp and mounts the app.
- `src/App.tsx` handles route protection and onboarding-based redirects.
- Auth state is stored in Zustand memory only through `src/store/authStore.ts`.
- `src/hooks/useAuth.ts` authenticates via Telegram `initData`, with mock auth fallback in development.
- API requests are centralized through `src/api/client.ts`, which attaches bearer auth and clears auth on `401`.
- Content and quiz flows are split across `src/api/content.ts` and `src/api/quiz.ts`.

## Working Agreements

- Do project work on the `dev` branch unless explicitly told otherwise.
- Read `PROJECT.md` and this file before substantial work.
- Treat `PROJECT.md` as a product brief, not guaranteed ground truth.
- Prefer the actual implementation in `src/` when `PROJECT.md` and code differ.

## Session Log

### 2026-04-23

- Read `PROJECT.md` and inspected the codebase structure.
- Confirmed the repo is a Vite + React + TypeScript Telegram Mini App.
- Confirmed `PROJECT.md` is partially stale because screen implementation already exists.
- Created and switched to the `dev` branch.
- Added this file so future sessions can resume context quickly.
- Aligned the frontend to the finished backend contract:
  - `.env.development` points to `https://web-production-312b.up.railway.app`
  - student/auth shape normalized around backend fields like `name`, `is_premium`, `subscription_expiry`, and `preferences`
  - premium gating now uses backend premium access behavior
  - quiz submission/results flow updated to backend attempt payload and summary response
  - resource downloads now use backend download URLs instead of dummy behavior
- Completed a Telegram-native UI pass across the app shell and main screens:
  - Telegram theme/viewport shell support added
  - shared Mini App styling added in `src/index.css`
  - home, resources, onboarding, subscribe, quiz, simulation, exit exams, performance, results, and resource viewer were redesigned toward a native Telegram Mini App feel
  - shared refinement done for buttons, empty/error/locked states, cards, badges, and question UI
- Current local preview during this work used `http://127.0.0.1:4174/`
- Resource picker needed several follow-up fixes:
  - year and semester tiles were corrected and centered
  - department and course rows were repeatedly refined
  - latest applied structure uses compact rows with `rounded-[16px]`, `px-5`, `py-3`, `min-h-[5rem]`, and `overflow-hidden`
  - there was a broken department row class during debugging that was fixed
- Bottom navigation selected-state contrast was improved:
  - active tab now uses stronger blue
  - active icon badge uses darker blue instead of pale white
- End-of-day user feedback:
  - year/semester cards were acceptable after fixes
  - bottom nav selected icons and resource picker rows were the main remaining visual pain points being iterated
  - if the resource page still looks wrong next session, inspect it first before touching unrelated screens

### 2026-04-24

- Refactored practice quiz flow to match the real backend contract the user provided:
  - `/quiz` is now setup only
  - `/quiz/list` fetches `GET /api/exams/?course=<id>&type=quiz`
  - `/quiz/take/:quizId` fetches `GET /api/exams/:quizId/questions/`
  - `/results` remains the shared summary screen
- `src/store/quizStore.ts` now preserves quiz setup context separately from the in-progress attempt so results and retry can route back to the correct quiz list.
- `src/api/quiz.ts` now exposes explicit course quiz list loading through `getCourseQuizzes(courseId)` instead of the previous hidden course-to-questions shortcut.
- `src/screens/ResultsScreen.tsx` retry behavior now returns practice attempts to the quiz list and simulation attempts back to their simulation route.
- Forced dev mocks were enabled for current frontend testing:
  - `.env.development` now uses `VITE_FORCE_DEV_MOCKS=true`
  - quiz setup/list/questions/submission and resources setup/list/downloads now all honor that flag in dev
- Practice quiz UX was refined for Telegram Mini App-style testing:
  - course tap on `/quiz` now navigates directly to `/quiz/list`
  - mock practice quizzes were normalized to 6 questions for quick end-to-end testing
  - quiz attempt auto-advances after an answer is selected
  - `QuestionCard` now has an explicit per-question hint toggle instead of always-visible hint text
- Resource library UX was adjusted around the user’s actual workflow:
  - past exams and exit exams were removed from the normal downloadable resource filters/list because they should be handled interactively elsewhere
  - resource cards are now download-first instead of viewer-first
  - resource card spacing was iterated several times; current state uses stronger internal horizontal padding and extra vertical height in `src/components/ResourceCard.tsx`
  - the featured pack downloads badge on `src/screens/ResourcesScreen.tsx` was restyled into a centered stacked number/label chip aligned to the top-right

## Next Work

- Continue all new implementation on `dev`.
- Keep this file updated when major work is completed.
- First check tomorrow:
  - open the quiz flow and verify `/quiz -> /quiz/list -> /quiz/take/:quizId -> /results` visually on mobile sizing
  - confirm the resource library card spacing/alignment now feels stable on-device; this was the main iterative UI area at the end of the session
  - keep pushing toward Telegram Mini App-native feel rather than browser-style card/list patterns
  - if further quiz work is requested, avoid collapsing setup and attempt back into one screen
