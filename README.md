# UniPortal Frontend

A Telegram Mini App for Unity University (Ethiopia) students. Inside Telegram, students can:

- browse and download study resources for their department, program, year and semester/term
- practice with quizzes, past exams and chapter-based **Selective Practice**, then review their answers
- take timed **exit exam** simulations (past years and model exams)
- look up their **exam schedule** (date, time, room)
- track their **performance** and request a **Premium subscription** (Telebirr / CBE payment reference)

This repo is the frontend only. The API is a separate Django + DRF project (`uniportal-backend`).

---

## Tech stack

| Area      | Choice |
|-----------|--------|
| Framework | React 19 + Vite 7 |
| Language  | TypeScript |
| Styling   | Tailwind CSS v4 (no config file; theme tokens live in `@theme` in `src/index.css`) |
| State     | Zustand v5 |
| Routing   | React Router v7 |
| HTTP      | Axios (plus native `fetch` for the Telegram login call) |
| Telegram  | `@twa-dev/sdk` |
| Other     | `react-pdf` (legacy pdf.js build, for the in-app reader), `lucide-react` |

---

## Running locally

### Prerequisites

- **Node.js 20.19+ or 22.12+** (required by Vite 7) and npm
- Optional: the backend running locally on `http://127.0.0.1:8000`. Without it, you can run on mock data (see below).

### 1. Install

```bash
git clone <repo-url> uniportal-frontend
cd uniportal-frontend
npm install
```

### 2. Configure environment

Vite loads `.env.development` when you run `npm run dev` and `.env.production` when you run `npm run build`. For your own machine, create a `.env.development.local`. It overrides `.env.development` and is git-ignored (`*.local`).

```bash
cp .env.example .env.development.local
```

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend origin, without `/api`. Local: `http://127.0.0.1:8000`. Production: the Railway URL in `.env.production`. |
| `VITE_TELEGRAM_BOT_USERNAME` | The bot that hosts the Mini App. |
| `VITE_FORCE_DEV_MOCKS` | `true` serves everything from `src/api/devMocks.ts` with no backend needed. `false` calls the real API. |

All `VITE_*` values are compiled into the client bundle, so never put secrets in them.

### 3. Start the dev server

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### 4. Pick a data mode

**A. Mocks only (frontend work without a backend).** Set `VITE_FORCE_DEV_MOCKS=true`.
- Auth uses a mock student stored in `localStorage` under `uniportal-dev-student`. The mock student is always **Free**.
- Departments, courses, resources, quizzes, past exams, exit exams, selective-practice chapters, subscriptions and the exam schedule all come from `src/api/devMocks.ts`.
- Exit exam mocks deliberately use timers of only a few minutes, so you can test the timer and submit flow quickly.

**B. Local backend.** Set `VITE_FORCE_DEV_MOCKS=false` and start the backend on `VITE_API_BASE_URL`.
- A normal browser has no Telegram `initData`, so in dev the app logs in with the backend's dev-mode login: `POST /api/auth/telegram/` with `dev_mode: true` and test user `telegram_id: 999999`. The backend must have dev-mode login enabled.
- The backend must allow your dev origin in CORS (for example `http://localhost:5173`).

> **Dev-only fallbacks.** With mocks off, a dev build falls back to mock data only when the backend is **unreachable** (no HTTP response); the console then logs `[dev] Backend unreachable, using mock ...`. HTTP errors (401, 403/upgrade, 404, 500) always reach the screens so they are never masked. All of this lives in `src/api/devFallback.ts` (`withDevFallback`). None of it exists in production builds; the mock module is not in the bundle.

### 5. Testing inside Telegram (optional)

Real Telegram login needs the app served over HTTPS and opened from the bot:

1. Expose the dev server with a tunnel, for example `cloudflared tunnel --url http://localhost:5173` or `ngrok http 5173`.
2. Vite 7 rejects unknown hosts, so add the tunnel host to `server.allowedHosts` in `vite.config.js` for that session.
3. In @BotFather, set the bot's Mini App / menu button URL to the tunnel URL.
4. Point `VITE_API_BASE_URL` at a backend that Telegram's webview can reach. The backend validates `initData` with the bot token.

The backend may answer the login with `403 { error: "CHANNEL_REQUIRED", channel_url }`. In that case the app shows `ChannelGateScreen` until the student joins the channel.

---

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Starts the Vite dev server with HMR |
| `npm run build` | Builds for production into `dist/` (uses `.env.production`) |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run lint` | Runs ESLint (TypeScript + React Hooks rules) |
| `npm run typecheck` | Type-checks with `tsc --noEmit`; `build` does not type-check |

There is no test suite yet. Before pushing, run `npm run lint`, `npm run typecheck` and `npm run build`.

---

## How it works

### Startup and auth

```
main.tsx       WebApp.ready() / expand(), disable vertical swipes, enable closing confirmation
App.tsx        useTelegramChrome() applies the UniPortal palette; initAuth() runs on mount
useAuth.ts     loginWithTelegram()   -> POST /api/auth/telegram/ { init_data }   (inside Telegram)
               loginWithDevMode()    -> dev only, no initData, mocks off
               mock student          -> dev only, VITE_FORCE_DEV_MOCKS=true
authStore      { token, student } kept in memory only (never written to localStorage)
routing        "/" -> /onboarding (profile not set) or /home
```

- The Telegram login request uses native `fetch` and sends `initData` exactly as Telegram provides it. **Do not change this.** Any change to that string breaks the backend's signature check.
- `src/api/client.ts` is the shared Axios instance. It:
  - adds `Authorization: Bearer <token>` to every request
  - on `401` expires the session: the app logs in again once, then Splash offers "Try again" (a request can opt out with `skipAuthClear`)
  - shows a global "slow request" loader after 700 ms (a request can opt out with `skipGlobalLoader`, used for silent background refreshes)
  - times out after 15 s and accepts an `AbortSignal` (screens cancel requests they no longer need)
  - turns every error into an `ApiError`: `{ status, message, upgrade_required, network, aborted }`

### Attempts and the PDF reader

- The active quiz/exam attempt is saved to `localStorage` (`quizStore`, zustand `persist`): it survives reloads and closing the Mini App, expires after 24 h, and is only offered back (the "Unfinished attempt" card) to the student who started it. Timed exams store a deadline, so the clock can't drift while Telegram is in the background.
- `/resources/:id/read` is the in-app PDF reader (lazy-loaded). It downloads the whole file from the signed `/download/` URL, so **that URL must allow CORS from the Mini App origin**, renders only the pages near the reading position, and draws a watermark (name and ID from `/api/students/me/watermark/`) on every page. pdf.js fonts, character maps and decoders are served from our own origin by the `pdfjs-assets` plugin in `vite.config.js`.

### Styling

- Use the palette tokens from `@theme` in `src/index.css` (`bg-ink`, `text-subtle`, `text-faint`, `bg-mist`, `bg-accent-soft`, `text-danger`, ...) instead of hardcoded hex classes.
- Global element resets in `index.css` must live in `@layer base`. Unlayered CSS beats every Tailwind utility; that is how a `button` reset once disabled all button background and padding classes.
- Use `Button` variants (`primary`, `secondary`, `ghost`, `danger`) rather than inline colour styles. Dialogs use `useDialogFocus` for focus handling and Escape.
- System fonts on purpose: no web fonts are loaded.

### Student profile

During onboarding the student picks a **department, program** (`regular | extension | distance`), **year** and **period**. The period is a semester for regular and extension students, and a term (I–III) for distance students; see `src/utils/periods.ts`. The choice is saved with `PATCH /api/students/me/`. Resources and practice screens then open on the shelf for that saved profile, and students can change the filters from there.

### Premium access

A student is Premium only when `subscription_status === "premium"` **and** `subscription_expiry` is in the future (`normalizeStudent` in `src/api/auth.ts`, `useAccess` hook). The backend is the real enforcement. The frontend only shows locked states and sends students to `/subscribe`.

### Routes

| Route | Screen |
|-------|--------|
| `/` | Splash, then redirect |
| `/onboarding` | Profile setup |
| `/home` | Dashboard, profile and subscription status, quick links |
| `/resources`, `/resources/:id` | Resource library, resource detail and download |
| `/resources/:id/read` | In-app PDF reader with watermark |
| `/quiz` | Practice Hub: quiz, past exam, selective practice |
| `/quiz/setup` → `/quiz/list` → `/quiz/take/:quizId` | Practice flow |
| `/quiz/selective` → `/quiz/selective/take` | Chapter-based selective practice |
| `/exit-exam` → `/exit-exam/list/:category` → `/simulate/:examId` | Timed exit exams |
| `/results` | Score, topic breakdown, answer review |
| `/exam-schedule` | Exam schedule lookup by student ID or name |
| `/performance` | Attempt history and weak topics |
| `/subscription`, `/subscribe` | Plan and status page, payment request |

### Project layout

```
src/
├── api/          Backend calls (auth, content, quiz, exams) + client.ts + devMocks.ts
├── store/        Zustand stores: auth, content (picker/resources), quiz (setup + attempt), network
├── hooks/        Auth/access, Telegram, and shared screen logic: useCourseFilter, useAsyncData,
│                 useSubscriptionStatus, useAttemptSubmit, useResourceDownload, useDialogFocus
├── screens/      One file per route (all lazy-loaded except Splash, Home and the channel gate)
├── components/   Shared UI (QuestionCard, ResourceCard, ExamTimer, ResumeAttemptCard, ...)
│   ├── ui/       Primitives: Button, Skeleton, EmptyState, ErrorState, SearchInput
│   └── <area>/   Pieces of larger screens: pdf, resources, selective, subscribe, answerReview
├── utils/        Formatting, periods, subscription, errors, practice/exit-exam/question helpers
└── types/        Shared types (exam schedule)
```

### Main backend endpoints

`/api/auth/telegram/` · `/api/students/me/` · `/api/departments/` · `/api/departments/:id/courses/` · `/api/courses/:id/resources/` · `/api/resources/:id/` · `/api/resources/:id/download/` · `/api/exams/` · `/api/exams/:id/questions/` · `/api/exams/active-term/` · `/api/exams/lookup/` · `/api/quiz/attempts/` · `/api/quiz/courses/:id/chapters/` · `/api/quiz/selective-practice/` · `/api/exit-exams/topics/` · `/api/subscription/plans/` · `/api/subscription/request/`

---

## Further docs

- `CODEX_CONTEXT.md`: dated log of decisions and backend-contract changes. This is the most up-to-date description of the code.
- `PROJECT.md`, `PHASE2_SCREENS.md`: the original product brief and screen specs. Treat them as background only; parts are out of date.
