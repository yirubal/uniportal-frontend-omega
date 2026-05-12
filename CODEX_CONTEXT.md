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
  - subscription requests now collect `payment_method` and `payment_reference`, check pending request state, and render API-provided payment options
  - results now compute fallback percentage from `score / gradable_total` and labels non-auto-graded items as `Not graded`
- Deliberately deferred full pending-review UI for non-auto-graded questions per user instruction.
- Verification after this pass: `npm run lint` and `npm run build` both passed.
- Auth validation was tightened after backend integration feedback:
  - Telegram login now reads `window.Telegram.WebApp.initData` only inside `loginWithTelegram()`, immediately before the auth request
  - `window.Telegram.WebApp.ready()` is called again in the auth function before reading `initData`
  - the auth POST now uses native `fetch` with `JSON.stringify({ init_data: initData })` to avoid Axios/interceptor questions on the Telegram login request
  - keep this raw string behavior unchanged because Telegram signature validation is sensitive to any initData mutation
- Telegram-native color override was disabled for app UI:
  - `useTelegramChrome` now writes a fixed UniPortal palette into `--tg-*` variables instead of copying Telegram theme colors
  - the global palette moved from saturated blue/navy toward softer green-slate, warm gold, and calm neutral surfaces for better readability inside Telegram
- Started UI/UX polishing from the exam upgrade path:
  - shared `Button` disabled states now use explicit readable colors instead of opacity-based gray/white contrast
  - the locked premium CTA that says `Upgrade from ETB 99` keeps the same primary-button treatment as the rest of the app
  - `SubscribeScreen` was restyled for stronger contrast across premium benefits, selected plan cards, payment method buttons, payment reference, and payment option text
  - verification after this pass: `npm run lint` and `npm run build` both passed
- Implemented profile-first content tailoring after onboarding:
  - added `src/hooks/useStudentProfile.ts` as the shared reader for the saved department/program/year/period profile
  - `ResourcesScreen` now opens on the saved-profile course shelf first, with `Change filters` and `Edit profile` as secondary actions
  - `PracticeSetupScreen` now opens on the saved-profile course shelf for both quiz and past-exam paths before loading `/quiz/list`
  - `ExitExamScreen` and `ExitExamListScreen` now show saved-profile context in their copy while continuing to load exit exams from the student department
  - verification after this pass: `npm run lint` and `npm run build` both passed
- Refined the subscription page back into the app's normal visual system:
  - removed the dark premium/pricing blocks that felt off-brand and caused white-on-light contrast confusion
  - plan cards now use neutral surfaces, green-slate selected state, dark readable text, and stacked price/duration rows to avoid cramped mobile alignment
  - payment instructions and payment method controls now use the same green-slate brand treatment as other selected states
  - verification after this pass: `npm run lint` and `npm run build` both passed
- Follow-up subscription/payment proof polish:
  - kept the extra pricing-side spacing that prevents plan duration/price text from crowding the card edge
  - selected payment methods now use a stronger green-slate selected fill
  - the payment proof field is now labeled as a payment reference instead of asking CBE users for a full sender account number
  - `LockedOverlay` now forces the premium upgrade CTA to dark background/white text so the `Upgrade from ETB 99` button cannot render white-on-white
  - verification after this pass: `npm run lint` and `npm run build` both passed
- Subscription request UX follow-up:
  - `SubscribeScreen` now has an inline `Request subscription` button directly after the payment reference field, while the sticky footer CTA uses the same request action
  - submitting opens a status modal that shows request submission, pending payment processing, approved payment confirmation, or rejected payment messaging from `PaymentInstructions.status`
  - primary request buttons use explicit inline brand fill colors so the global button reset cannot hide their backgrounds
  - subscription request details are rendered defensively because existing backend request/status responses may omit `payment_options`, `reference`, `amount`, or `days`; do not assume those fields are always present on page load
  - status modal is now compact and centered, includes X/cancel close controls, and no longer sits on the bottom navigation area
  - frontend blocks repeat subscription submissions while an existing request is `pending` or `approved`; backend still needs idempotency/uniqueness to prevent dashboard duplicates from other clients or repeated network calls
  - subscription modal/page copy now tells pending users the payment request is under review and that the bot will notify them after confirmation; the actual Telegram bot notification must be sent by the backend
  - `HomeScreen` refreshes `/api/students/me/` on mount so Premium/Free labels do not stay stale after backend status changes, and it reads `/api/subscription/request/` to show an `Under review` label on the profile card for pending payment requests
  - `normalizeStudent()` treats backend `subscription_status` as authoritative over `is_premium`, so `subscription_status: "free"` immediately downgrades stale premium labels/access on profile refresh
  - `/api/subscription/request/` is normalized around backend `current_request`, `has_pending_request`, and `pending_request`; `current_request.status` drives payment request labels (`pending`, `approved`, `rejected`), while `/api/students/me/` remains the premium/free source of truth
  - Home and Subscribe refetch both `/api/subscription/request/` and `/api/students/me/` on initial open/resume; Subscribe also refetches both after payment submit and when closing payment status
  - local auth mocks now run only when `VITE_FORCE_DEV_MOCKS=true`; `.env.development.local` was set back to `VITE_FORCE_DEV_MOCKS=false` so `/api/students/me/` can update Premium/Free from the backend instead of stale `uniportal-dev-student` localStorage data
  - Home top-right Premium/Free tag now forces Free when `current_request.status === "rejected"` so rejected payment state cannot keep showing Premium from stale auth cache
  - verification after this pass: `npm run lint` and `npm run build` both passed

### 2026-05-07

- Updated subscription payment proof flow to match the backend payment-review process:
  - students now see the selected Telebirr number or CBE account number before submitting a subscription request
  - the payment proof input is now method-specific: `Telebirr transaction number` or `CBE transaction ID`
  - frontend input filters to uppercase letters/numbers and requires a 10-12 character transaction number/ID before enabling submit; examples are Telebirr `DCE4R6BZA0` and CBE `FT261187472K`
  - `requestSubscription()` now sends `payment_reference` instead of sender account/phone-style `paid_from`
  - `/api/subscription/request/` normalization preserves top-level `payment_options` so the payment destination can render before any pending request exists
  - added `/subscription` as the student-facing plan/status page; it shows Free/Premium state, renders the same backend/mock plans as `/subscribe`, and has a branded request button that opens `/subscribe`
  - forced the local mock test student to Free by default, including previously cached `uniportal-dev-student` data
  - payment destination cards display both the backend-provided account/number and backend-provided account holder name; do not hardcode `Unity University` in the frontend
  - verification after this pass: `npm run lint` and `npm run build` both passed
- Added an onboarding escape path for students who do not want to complete setup immediately:
  - `OnboardingScreen` now shows a secondary `Cancel setup` action in the sticky footer
  - cancel opens the shared confirmation dialog, then closes the Telegram Mini App via WebApp close when running inside Telegram
  - browser preview fallback attempts `window.close()`, which may be blocked by normal browser tab rules
  - verification after this pass: `npm run lint` and `npm run build` both passed
- Tightened premium/free frontend handling after production appeared to show all students as Premium:
  - production env has `VITE_FORCE_DEV_MOCKS=false`, and the built `dist` did not contain the mock student
  - local dev mock student is Free by default, so the current frontend mock is not the source of production Premium labels
  - `normalizeStudent()` and `useAccess()` now require a valid future `subscription_expiry` before treating a student as premium
  - this matches the backend `Student.is_premium` model rule: `subscription_status === premium` plus non-null, unexpired `subscription_expiry`
  - verification after this pass: `npm run lint` and `npm run build` both passed

### 2026-05-08

- Added resource source trust badges for the backend `source` / `source_display` fields:
  - `Resource` now accepts `source` values `official`, `textbook`, `reference`, `notes`, and `other`, while remaining tolerant of missing/null cached API responses
  - `ResourceSourceBadge` is reused on resource cards, the featured pack, related resources, and the resource detail/download screen
  - non-official resources show a small pre-download disclaimer; official resources do not show extra warning copy
  - the resource list now has a second source-filter row for Official, Textbooks, Reference, Study notes, and Other while keeping past/exit exams out of the normal downloadable shelf
  - dev mocks include representative source values for local testing
  - verification after this pass: `npm run lint` and `npm run build` both passed
- Tightened the mobile resource card layout:
  - `ResourceCard` is now a compact stacked card with a 40px file icon, title/source/file-type/metadata content column, and a bottom access/download row
  - the source badge stays visible but uses an extra-small badge size inline with the plain file-type label instead of competing with a second top badge
  - the title uses CSS two-line clamping without pre-truncating the text, and metadata now reads as `date · downloads`
  - the download action and locked/premium behavior were not changed
  - verification after this pass: `npm run lint` and `npm run build` both passed
- Aligned resource course metadata with the backend many-to-many response:
  - `Resource` now uses optional `course_codes` and `course_names` arrays instead of the old single `course` id
  - `ResourceCard` supports `showCourseContext`; course pages pass `false`, while future global/search lists can pass `true` to show joined course codes
  - mock resource filtering now maps the selected course id to a course code and filters by `resource.course_codes`
  - related resources in the detail screen now match by overlapping `course_codes`
  - `module` is accepted/formatted as a resource file type because the backend can now return it
  - verification after this pass: `npm run lint` and `npm run build` both passed

### 2026-05-11

- Added the student exam schedule feature:
  - new typed exam schedule contracts live in `src/types/exams.ts`
  - new API helpers in `src/api/exams.ts` call `/api/exams/active-term/` and `/api/exams/lookup/`
  - exam schedule requests explicitly bypass client-side caching with no-cache headers plus a timestamp query param
  - exam APIs now also honor dev mocks so the Home card and schedule flow work when `VITE_FORCE_DEV_MOCKS=true`
- `HomeScreen` now conditionally shows an amber `Exam Schedule` quick-access card only when the active term API returns `active: true`
- Added `src/screens/ExamSchedule.tsx` and the protected `/exam-schedule` route:
  - students first see a search form for Student ID or registered full name
  - successful lookups group exams by date and emphasize room codes for physical navigation
  - inactive-term, loading, and not-found/error states are handled on-page without exposing exam data publicly
- Shared API error shaping in `src/api/client.ts` now surfaces backend `{ error: ... }` messages in addition to `message` and `detail`
  - verification after this pass: `npm run lint` and `npm run build` both passed

### 2026-05-12

- Fixed exam schedule visibility/fetching issues after local testing feedback:
  - `.env.development.local` now points back to `http://127.0.0.1:8000` instead of the stale `8002` override, matching the repo default backend port
  - `HomeScreen` now always shows the exam schedule entry card; active-term only improves the label and no longer gates visibility
  - `ExamSchedule` no longer replaces the whole page with an inactive-term/error state if `/api/exams/active-term/` fails or returns inactive; it still shows the search form with a compact retry notice
  - `ExamScheduleCard` supports an unknown term label for fallback visibility
  - `fetchActiveTerm()` defensively normalizes active-term response variants such as `{ active: true }`, `{ is_active: true }`, or a nested `term`
  - `client.ts` now preserves network error messages with the called path, and local development lookup errors show the API status code
  - keep lookup errors from the backend visible during development; mock fallback should not mask real backend `404/401` responses as fake "No exam found" results
  - removed custom `Cache-Control` / `Pragma` request headers from `src/api/exams.ts` after Firefox reported CORS preflight failure for disallowed `cache-control`; `_ts` query params remain for cache busting
  - compacted the exam schedule results UI only: smaller result header, minimal date rows, inline time/room exam cards, no `ROOM` label, no session line, and smaller bottom warning
  - restored shared page chrome around the compact results: standard `app-topbar`, `TopBackButton`, section label, title sizing, and `app-scroll app-scroll-compact` spacing so it matches other UniPortal pages
  - result summary now shows `student name · ID: <id> · N exams found` when the backend returns `student_id`
  - active-term notice rendering is explicitly gated so it cannot display after results are loaded or when the active term is confirmed
  - exam result cards are hardened for long course names with `overflow-hidden`, `min-w-0`, two-line clamping, and `break-words`; course code/department metadata remains single-line truncated
  - active-term warning `Retry term check` and lookup-error `Try Again` actions now force the same dark teal background/white text treatment as the main search button to avoid inherited white/pink contrast issues
  - verification after this pass: `npm run lint` and `npm run build` both passed

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
