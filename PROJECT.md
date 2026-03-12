# uniportal-frontend — Project Bible

## What This Is
A Telegram Mini App for Unity University Ethiopia students.
Students browse organized study materials, download resources,
practice quizzes, and prepare for exit exams — all inside Telegram.

Built as the frontend for the Unity University Student Portal.
The backend (uniportal-backend) is a separate Django + DRF project
handled by a separate developer.

---

## Real Stack (Confirmed)
- **Framework:** React 19 + Vite 7
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (no config file — uses @theme in index.css)
- **State Management:** Zustand v5
- **API Client:** Axios
- **Routing:** React Router v7
- **Telegram SDK:** @twa-dev/sdk v8
- **PDF Viewer:** react-pdf v10
- **Icons:** lucide-react

## Key Tailwind v4 Note
There is NO tailwind.config.js in this project.
All theme tokens are defined in src/index.css using @theme {}.
Classes use standard Tailwind utilities (bg-white, text-sm etc).
Custom colors are referenced as bg-[#0A1628] or via CSS variables.

---

## Repository
GitHub: uniportal-frontend (private)

---

## Folder Structure
```
src/
├── api/
│   ├── client.ts         ✅ done
│   ├── auth.ts           ✅ done
│   ├── content.ts        ✅ done
│   └── quiz.ts           ✅ done
├── components/
│   ├── ui/
│   │   ├── index.ts      ✅ done
│   │   ├── Button.tsx    ✅ done
│   │   ├── Badge.tsx     ✅ done
│   │   ├── Card.tsx      ✅ done
│   │   ├── Skeleton.tsx  ✅ done
│   │   ├── EmptyState.tsx✅ done
│   │   └── ErrorState.tsx✅ done
│   ├── BottomNav.tsx     ✅ done
│   ├── ResourceCard.tsx  ✅ done
│   ├── QuestionCard.tsx  ✅ done
│   ├── LockedOverlay.tsx ✅ done
│   └── Watermark.tsx     ✅ done
├── screens/
│   ├── SplashScreen.tsx      ⬜ todo
│   ├── OnboardingScreen.tsx  ⬜ todo
│   ├── HomeScreen.tsx        ⬜ todo
│   ├── ResourcesScreen.tsx   ⬜ todo
│   ├── ResourceViewerScreen.tsx ⬜ todo
│   ├── QuizScreen.tsx        ⬜ todo
│   ├── ExitExamScreen.tsx    ⬜ todo
│   ├── SimulationScreen.tsx  ⬜ todo
│   ├── ResultsScreen.tsx     ⬜ todo
│   ├── PerformanceScreen.tsx ⬜ todo
│   └── SubscribeScreen.tsx   ⬜ todo
├── store/
│   ├── authStore.ts      ✅ done
│   ├── contentStore.ts   ✅ done
│   └── quizStore.ts      ✅ done
├── hooks/
│   ├── useTelegram.ts    ✅ done
│   ├── useAuth.ts        ✅ done
│   └── useAccess.ts      ✅ done
├── utils/
│   ├── watermark.ts      ✅ done
│   └── format.ts         ✅ done
├── App.tsx               ✅ done
├── main.tsx              ✅ done
└── index.css             ✅ done
```

---

## Design System
- **Primary:** #0A1628 (deep navy)
- **Accent:** #FFB400 (gold)
- **Background:** #F5F7FA
- **Surface:** #FFFFFF
- **Border:** #E0E0E0
- **Success:** #4CAF50
- **Error:** #F44336
- **Warning:** #FF9800
- **Border radius:** 8px small, 12px medium, 16px large, 20px xl
- **Font:** System font stack (-apple-system, BlinkMacSystemFont, Segoe UI)

---

## Authentication Flow
```
App loads
  → main.tsx calls WebApp.ready() + WebApp.expand()
  → App.tsx calls initAuth() on mount
  → useAuth.ts reads WebApp.initData
  → POST /api/auth/telegram/ with initData
  → receives { token, student }
  → stored in authStore (memory only, never localStorage)
  → App.tsx routes based on isAuthenticated + onboarding_complete
```

## Routing Logic
```
/ → if authenticated + onboarding done → /home
    if authenticated + no onboarding   → /onboarding
    if not authenticated               → SplashScreen (loading)

Protected routes: all except /
Bottom nav shows only when: authenticated + onboarding_complete
```

---

## API Base URL
Development: http://localhost:8000
Production: set in .env as VITE_API_BASE_URL

## Backend API contract
All endpoints are prefixed with /api/
Auth: Bearer token in Authorization header
Error format: { status, message, upgrade_required }

---

## Access Control (Frontend Rules)
- Backend is the real enforcement — frontend just handles UX
- Free users: show locked state, never attempt file fetch
- Premium check: subscription_status === "premium" AND expiry > now
- useAccess.ts hook used everywhere for access checks
- Locked content → navigate to /subscribe

---

## Current Phase
Phase 2 — Screens

## What Is Done
- [x] index.css (Tailwind v4 theme + animations)
- [x] main.tsx (Telegram SDK init)
- [x] App.tsx (router + protected routes)
- [x] All stores (authStore, contentStore, quizStore)
- [x] All hooks (useTelegram, useAuth, useAccess)
- [x] All API files (client, auth, content, quiz)
- [x] All utils (format, watermark)
- [x] All UI components (Button, Badge, Card, Skeleton, EmptyState, ErrorState)
- [x] BottomNav, ResourceCard, QuestionCard, LockedOverlay, Watermark

## What Is Left
- [ ] SplashScreen
- [ ] OnboardingScreen
- [ ] HomeScreen
- [ ] ResourcesScreen
- [ ] ResourceViewerScreen
- [ ] QuizScreen
- [ ] ExitExamScreen
- [ ] SimulationScreen
- [ ] ResultsScreen
- [ ] PerformanceScreen
- [ ] SubscribeScreen

---

## Key Decisions Log
- Tailwind v4 — no config file, @theme in index.css
- JWT in memory only (Zustand) — never localStorage
- Watermark rendered client-side as canvas overlay
- react-pdf for in-app PDF viewing
- Telegram WebApp.downloadFile() for native device downloads
- Backend enforces access — frontend handles UX gracefully
- No custom auth UI — Telegram identity used automatically
- tsconfig.json created manually (project was scaffolded without --template react-ts)