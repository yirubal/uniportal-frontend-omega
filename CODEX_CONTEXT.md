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

### 2026-04-29

- Reframed the old quiz-only area into a `Practice Hub` flow:
  - `/quiz` is now a hub screen with two branches: `Take quiz` and `Take past exam`
  - `/quiz/setup` now handles the department/year/semester/course selection that used to live directly on `/quiz`
  - `/quiz/list` now loads either `exam_type=quiz` or `exam_type=final` from `/api/exams/` based on the selected practice path
- The shared attempt renderer was kept and reused for mixed-format past exam questions:
  - `QuestionCard` was already capable of handling `mcq`, `true_false`, `fill_blank`, `matching`, and `essay`
  - past exam copy now makes it explicit that the practice flow is not limited to multiple choice
- Development mocks were extended so the new flow can be tested immediately:
  - added `final` exam papers in `src/api/devMocks.ts`
  - added mixed-format mock past exam questions with true/false, fill-in, matching, essay, and choice items
  - mock fill-in grading now compares normalized text answers instead of case-sensitive raw strings
- Home and navigation copy now refer to the area as `Practice Hub` / `Practice` instead of only quiz.
- Reframed the exit exam area into a timed exam-type hub:
  - `/exit-exam` is now a hub screen with `Past years exit exam` and `Exit exam model`
  - `/exit-exam/list/:category` now shows the actual papers for the selected timed exam type
  - `/simulate/:examId` remains the timed attempt route, but its back navigation now returns to the selected exit exam type list instead of the generic hub
- Exit exam categorization is prepared for backend variation:
  - `ExamPaper` now supports optional `exit_category`
  - if backend data does not yet send that field, the frontend falls back to title keyword matching for `past years` and `model`, otherwise defaults to the model bucket
- Development mocks were extended so both visible timed exam types are present in dev immediately.
- The timed simulation header now includes a countdown progress bar plus a low-time pulse state so the timer feels visibly active instead of only changing text.
- The exit exam paper cards now lead into a rules-first pre-start screen, and the start CTA text is explicit per exam type (`Start timed past paper` / `Start timed model exam`).
- Current dev exit exam mocks are intentionally short for workflow testing:
  - exit exam mock durations were reduced to a few minutes
  - dedicated fake question sets were added for the visible exit exam papers so the countdown timer and submission path can be tested quickly end to end
- The timed exit exam attempt now follows a more standard exam-app pattern:
  - keep one question visible at a time on mobile
  - provide a question navigator grid for direct jumping
  - support marking questions for review during the timed attempt
  - prefer this over rendering a long multi-question page during timed exams
- End-of-day state for tomorrow:
  - Practice Hub is split into quiz and past exam flows and is already wired through setup, list, attempt, and results
  - Exit Exams now only shows `Past years exit exam` and `Exit exam model`
  - exit exam intro screen has a clearly visible dark start button both inline and in the footer
  - timed exit exam mocks are short on purpose for quick workflow and timer testing in dev
  - the latest thing to validate visually tomorrow is the timed exit exam UX on-device: start CTA visibility, timer countdown bar, navigator grid, jump behavior, and mark-for-review state

### 2026-04-30

- Completed the first pre-integration blocker pass before live backend connection:
  - `.env.development` now targets local backend development with forced mocks disabled
  - `.env.example` and `.env.production` document the required API/bot/mock variables
  - auth dev fallback can call the backend dev-mode Telegram login payload when not forcing mocks
  - exam questions now send the required `mode=practice|simulation` query param
  - exit-exam topic questions API helper exists for `/api/exit-exams/topics/questions/`
  - matching questions are submitted as an empty string when they are not user-answered
  - premium quiz/past-exam papers now send free students to subscribe instead of opening the attempt
  - resource locks now respect backend `is_locked` in addition to access level
  - subscription requests now collect `payment_method` and `paid_from`, check pending request state, and render API-provided payment options
  - results now compute fallback percentage from `score / gradable_total` and labels non-auto-graded items as `Not graded`
- Deliberately deferred full pending-review UI for non-auto-graded questions per user instruction.
- Verification after this pass: `npm run lint` and `npm run build` both passed.
- Auth validation was tightened after backend integration feedback:
  - Telegram login now reads `window.Telegram.WebApp.initData` directly at auth time and sends it as `init_data` without encoding, decoding, parsing, or rebuilding
  - keep this raw string behavior unchanged because Telegram signature validation is sensitive to any initData mutation

## Next Work

- Continue all new implementation on `dev`.
- Keep this file updated when major work is completed.
- First check tomorrow:
  - open the practice flow and verify `/quiz -> /quiz/setup -> /quiz/list -> /quiz/take/:quizId -> /results` for both quiz and past exam paths on mobile sizing
  - open the exit exam flow and verify `/exit-exam -> /exit-exam/list/:category -> /simulate/:examId` for both timed exam types and confirm the countdown bar/chip animate correctly
  - while testing exit exams in dev mocks, expect intentionally short timers rather than realistic exam durations
  - confirm the question navigator grid and mark-for-review states behave correctly while moving around the timed exit exam
  - confirm the resource library card spacing/alignment now feels stable on-device; this was the main iterative UI area at the end of the session
  - keep pushing toward Telegram Mini App-native feel rather than browser-style card/list patterns
  - if further practice work is requested, keep the hub split and avoid collapsing setup and attempt back into one screen
