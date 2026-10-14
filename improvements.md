# UniPortal Frontend — Improvements Plan

Findings from a full code review on 2026-10-14 (branch `dev`, commit `0cbeb3a`).
Work through the phases in order. Each phase should end with `npm run lint`, `npm run typecheck` (added in Phase 0) and `npm run build` passing.

Severity: 🔴 high · 🟠 medium · 🟢 low

---

## Phase 0 — Safety net (do first, small)

Without these, later phases have no automated checks.

- [x] 🔴 **ESLint checks no TypeScript.** _Done: `react-hooks/set-state-in-effect` and `purity` are temporarily warnings (13 left) until the rest are fixed in Phase 6; switch them back to errors afterwards._ `eslint.config.js` targets `**/*.{js,jsx}` and `src/` has none, so `npm run lint` checks nothing. Install `typescript-eslint` and target `**/*.{ts,tsx}`. This also turns on the `react-hooks` rules. Expect a batch of new warnings to triage.
- [x] 🔴 **No type-checking in the pipeline.** `vite build` passes even though there are 19 `tsc` errors. Add `"typecheck": "tsc --noEmit -p tsconfig.json"` and fix the errors:
  - `api/quiz.ts` `normalizeSubscriptionRequestState`: the `in` checks don't narrow. Add a type guard.
  - `api/devMocks.ts` `getMockExitExamTopicQuestions` uses the undefined `MOCK_QUESTIONS_BY_EXAM`, so it throws a ReferenceError at runtime. It should be `MOCK_EXAM_QUESTIONS`. Also, `topicKey.includes("")` matches every question.
  - `api/auth.ts`: the dead `program` alias key in the preference mapping.
  - `hooks/useTelegramChrome.ts`: declare `APP_THEME` `as const` so the colors type as `` `#${string}` ``.
  - `EmptyState` gets `actionLabel` / `onAction` props it doesn't declare, so those action buttons never render (QuizList, PracticeSetup, ExitExamList, SelectivePractice). Add the props to `EmptyState`.
  - `PracticeSetupScreen`: a `number | null` is passed where a `number` is required.
- [x] 🔴 **Telegram `initData` is logged in production.** `api/auth.ts` `loginWithTelegram` calls `console.info` with the first 100 characters of `initData`. Remove it, or wrap it in `import.meta.env.DEV`.
- [x] 🟢 **Wrong entry path.** `index.html` loads `/src/main.jsx`, but the file is `main.tsx`. It only works because Vite resolves it anyway. Point it at the real file.

---

## Phase 1 — Critical correctness bugs

These are bugs students hit, or that give them wrong information.

### Quiz / exam flows
- [x] 🔴 **A failed submission shows a fake 0% result.** In `QuizAttemptScreen` `handleSubmit`, the `catch` builds a 0% summary and goes to Results. The attempt was never saved. Keep the student on the quiz, show the error and offer **Retry submit**.
- [x] 🔴 **The simulation timer drifts and pauses in the background.** `SimulationScreen` subtracts 1 per `setInterval` tick. Telegram or the browser throttles intervals when the app is minimized, so exams last longer than their real time. Store `deadline = Date.now() + totalTime*1000`, compute the time left from it on each tick, and recompute on `visibilitychange`.
- [x] 🔴 **A failed simulation submit is invisible and retries forever.** The active-exam view never renders `error`, and at 0:00 `tick` calls `handleSubmit` every second. Stop the timer once it expires, try one guarded submit, and show the error with a manual retry.
- [x] 🟠 **Double submit.** Simulation's "Submit simulation" button isn't disabled while submitting. Both screens guard with `submitting` state captured in a callback, which can be stale. Guard with a `useRef` and disable all submit buttons.
- [x] 🟠 **Simulation can show another exam's attempt.** It doesn't check that the attempt in the store belongs to the `:examId` in the URL; `QuizAttemptScreen` does. Require `examPaperId === Number(examId)`.
- [x] 🟠 **Results on reload or direct open.** With an empty store, `ResultsScreen` shows "0% / Needs more practice". Redirect to `/quiz` when `attemptSummary` is null.

### Auth / app shell
- [x] 🔴 **A 401 leaves the student on an endless spinner.** `client.ts` calls `clearAuth()`, which sets `error=null` and redirects to `/`. `SplashScreen` only shows "Try again" when `error` is set, and nothing re-runs the login. Re-run `initAuth()` once, or set a "Session expired" error.
- [x] 🟠 **The "not joined" message never shows on the channel gate.** `ChannelGateScreen` calls `initAuth()`, which sets the global `isLoading`. App then swaps in `SplashScreen`, and the gate unmounts before its toast shows. Check membership without the global loading flag.
- [x] 🟠 **`initAuth` can run more than once at a time.** `App.tsx` calls it from `useEffect([])` with no guard: StrictMode, Splash retry and the gate can all trigger it, and the slower response wins. Keep a module-level in-flight promise.

### Resources
- [x] 🟠 **Resources can show a skeleton forever.** In tailored mode, if departments fail to load or don't include the profile's department, `selDept` stays null and the skeleton never ends. Show an error or a "change filters" state.

---

## Phase 2 — API & data layer hardening

- [x] 🔴 **Dev fallbacks hide real backend errors.** Every `catch` in `content.ts`, `quiz.ts` and `exams.ts` returns mocks when `import.meta.env.DEV` is true, including for 401, 403 (`upgrade_required`) and 500. The worst cases:
  - `submitAttempt` grades locally.
  - `requestSubscription` returns fake payment instructions.
  - `getMyAttempts` and `getMyPerformance` always return mocks on localhost.

  Use mocks only when `VITE_FORCE_DEV_MOCKS=true`, and otherwise fall back only on network errors, never on HTTP responses. (Production is not affected: I checked that the built bundle contains no mock data.)
- [x] 🟠 **Shared mock helper.** `getMocks`, `isDev`, `forceDevMocks` and `ApiRequestOptions` are copied across 3–4 files, and each mock filter appears twice. Create `api/devFallback.ts` with a `withDevFallback(realFn, mockFn)` helper. `getPlans` has no force-mock branch at all.
- [x] 🟠 **Timeouts.** The axios client has no `timeout`, and the Telegram login `fetch` has no abort. A request that hangs leaves the loader up forever. Add a timeout of about 15s and `AbortSignal.timeout`, without changing the `initData` payload.
- [x] 🟠 **Cancellation.** Let API functions accept an optional `signal: AbortSignal`, and abort in effect cleanups. That fixes the stale-response races in:
  - ResourcesScreen (courses and resources)
  - ResourceViewerScreen (switching `id`)
  - SelectivePractice (courses and chapters)
  - PracticeSetup
  - QuizAttempt (question loading)
  - ExamSchedule (pressing Enter during a lookup)
- [x] 🟠 **Login errors lose detail.** `useAuth` turns every failure into "Authentication failed". Show `error.message` when it exists.
- [x] 🟠 **Premium logic is duplicated.** It is computed separately in `normalizeStudent`, `useAccess`, `HomeScreen` and `SubscriptionScreen`. Make one helper the source of truth. Decide how to treat `premium` with a null expiry (currently not premium), and stop showing "Expires today" for expired subscriptions (`daysRemaining` is clamped to 0).
- [x] 🟢 **Small number bugs.**
  - `auth.ts` turns `Number("abc")` into `NaN` instead of `null`.
  - `quiz.ts` computes a `NaN` percentage when `score` is missing.
  - `format.ts` `formatScore` divides by `total` with no zero check.
- [x] 🟢 **Fragile network counter.** `client.ts` reads the count from before `set`, and the request-error interceptor stops tracking a request it never started. Compute the count from `getState()` after begin/end.
- [x] 🟢 **Dead code and gaps.**
  - Remove the no-op `catch (e) { throw e }` in `exams.ts`.
  - Add `"module"` to `FilterType` in `contentStore`.
  - ~~Version-gate the MainButton calls in `useTelegram`.~~ Not needed: MainButton exists since Bot API 6.0, the first Mini App version.
  - `main.tsx` gates `disableVerticalSwipes`, which needs Bot API 7.7, on 6.1.

---

## Phase 3 — Attempt resilience & practice UX

- [x] 🔴 **Attempts don't survive a reload.** `quizStore` lives only in memory, so a WebView kill or reload loses timed-exam progress. Save the active attempt (questions, answers, marked questions, deadline, exam id) with zustand `persist`, and offer **Resume attempt**. Clear it on submit. _Done with localStorage instead of sessionStorage, so a timed exam can be resumed after the Mini App is closed; saved attempts expire after 24h and only resume for the same student._
- [x] 🟠 **Retry reloads the whole app.** `window.location.reload()` is used for retry in QuizAttempt, Simulation, QuizList, ResourceViewer and Subscribe. It wipes the store, so selective practice can never recover. Re-run the fetch instead.
- [x] 🟠 **No confirmation before finishing.** "Finish now" submits straight away even with unanswered questions. Show `ConfirmDialog` with the number of unanswered questions.
- [x] 🟠 **Retakes from Performance use the wrong course.** `resetAttempt` keeps `courseId`/`courseName`, so "Try again" opens the previous course's list. `resolvePaperId` matches a paper title against `course_name`, which is fragile. Set the course from the paper, and ask the backend to always return `paper_id`.
- [x] 🟠 **Simulation fetches every exit exam to find one.** It calls `getExitExams()` (2–3 list requests) to look up a single exam. Pass the paper through router state or fetch it by id. Add a back button to the error view.
- [x] 🟠 **The subscribe status modal opens on every visit.** It opens whenever any request exists, including old approved or rejected ones. Open it automatically only for pending requests. Disable Cancel while submitting.
- [x] 🟢 **Pass thresholds disagree.** "Passed" uses 50%, but the ring and topic badges turn green at 60%. Use one constant. _Done: `PASS_PERCENTAGE = 50` in `utils/format.ts`._
- [x] 🟢 **QuestionCard's "Save answer" does nothing new.** The answer already saves on every keystroke. Remove one of the two.
- [x] 🟢 **The selected quiz ring never shows.** `QuizListScreen` resets the attempt on mount, which clears `selectedQuizId`.
- [x] 🟢 **The onboarding "Update setup" form starts empty.** Pre-fill it from the student profile. Add a retry when departments fail to load.
- [x] 🟢 **Rejected payments have a confusing button.** The subscribe button appears twice, and when payment is rejected the CTA says "Payment not confirmed". Keep one button and label it "Resubmit request".

---

## Phase 4 — Resources, downloads & content protection

- [ ] 🔴 **The resource viewer can't be reached.** Tapping a `ResourceCard` downloads the file immediately; the only way to reach `/resources/:id` is the viewer's own "related" list. Make the card open the viewer, and give download its own button with an `aria-label`.
- [ ] 🟠 **Create one `useResourceDownload` hook.** Card and viewer duplicate the download logic. In the shared hook:
  - Version-gate `WebApp.downloadFile`, which needs Bot API 8.0.
  - Fall back to `WebApp.openLink` rather than `window.open`.
  - Reject non-http URLs.
  - Show errors to the student; the card currently ignores everything except 403.
- [ ] 🟠 **Decide what to do about the PDF viewer and watermark.** `react-pdf` is installed but never imported, and `Watermark.tsx` is never rendered. Either:
  - **(a)** build an in-app viewer: react-pdf with `workerSrc` set via `new URL(..., import.meta.url)`, pages rendered on demand, and a watermark overlay; or
  - **(b)** remove the dependency and the component, and rely on the server-side watermark.

  Either way, treat the client watermark as a deterrent only. If you keep it, scale the watermark canvas for `devicePixelRatio`.

---

## Phase 5 — Performance

- [ ] 🟠 **Split routes.** All 19 screens load eagerly into one 522 KB chunk (151 KB gzip). Use `React.lazy` plus `Suspense` per route, starting with the exam, simulation, subscribe and review-modal screens.
- [ ] 🟠 **Store selectors.** `useQuizStore()`, `useContentStore()` and `useAuthStore()` are called with no selector (in QuizAttempt, Simulation, Resources, useAccess, useStudentProfile, App), so these components re-render on every store change. Use selectors or `useShallow`. In ResourcesScreen, the `loadResources` memo depends on the whole store, so it never actually memoizes.
- [ ] 🟠 **Simulation re-renders every second.** The timer re-renders the whole screen, including the navigator grid and `QuestionCard`. Move the timer into its own component, wrap `QuestionCard` in `memo` with a stable `onSelect`, and debounce the fill-blank and essay inputs, which currently write to the store on every keystroke.
- [ ] 🟢 **Image size.** The splash image is 92 KB but displayed at 96px. Resize it and convert to WebP.

---

## Phase 6 — Refactor & de-duplicate

- [ ] 🟠 **Extract a `useAttemptSession` hook** (loading, submit, answer payload mapping, leave dialog), plus shared `AttemptFooter` and `LeaveDialog` components for QuizAttempt and Simulation.
- [ ] 🟠 **Extract a `useCourseFilter` hook** for the department, program, year, period and course cascade. It is currently repeated in PracticeSetup, SelectivePractice and Resources.
- [ ] 🟠 **Extract `useSubscriptionStatus`.** The ref, refresh and throttle sync logic is copied across Home, Subscribe and Subscription.
- [ ] 🟠 **Split the large components.**
  - `SubscribeScreen` (667 lines) → Plans, PaymentForm, StatusModal
  - `ResourcesScreen` (622 lines) → SelectView, ListView
  - `SelectivePracticeScreen` (595 lines)
  - `AnswerReviewModal` (594 lines)
- [ ] 🟢 **Shared UI pieces.** Add a `SelectableCard` (used in Resources and Onboarding), a `SearchInput`, and one shared `formatActiveTermLabel` (currently in both ExamSchedule and ExamScheduleCard).
- [ ] 🟢 **Delete dead code.**
  - Unused `ui/Card.tsx` and `ui/Badge.tsx`
  - The commented-out icon in HomeScreen
  - The `public/*:Zone.Identifier` Windows artifact, which is served publicly
  - The redundant ternary in SelectivePractice (`useTailoredStart ? profile.departmentId : profile.departmentId`)
- [ ] 🟠 **Clear the remaining `set-state-in-effect` warnings** (derived state in PracticeSetup, SelectivePractice, QuizList, ExitExamList, Onboarding, Subscription, QuestionCard, AnswerReviewModal), then set `react-hooks/set-state-in-effect` and `react-hooks/purity` back to errors in `eslint.config.js`.
- [ ] 🟠 **Decide: should a premium student with a pending or rejected renewal show as "Free"?** Home and Subscription currently hide premium whenever a payment request is pending or rejected, even though the student still has an active subscription. Settle this when building `useSubscriptionStatus`.
- [ ] 🟢 **Clean up the auth store.** `Student` stores preferences twice (the `preferred_*` fields and `preferences.*`). Keep one shape.

---

## Phase 7 — Design system & accessibility

- [ ] 🟠 **Use the theme tokens.** `@theme` defines the palette, yet the code has about 720 hardcoded hex values and almost no token classes. Move to `bg-ink`, `text-text-secondary` and similar. ChannelGateScreen is almost entirely inline styles with JS press handlers.
- [ ] 🟠 **Add a `dark` Button variant** to replace the repeated inline `style={{ backgroundColor: "#172B2F" }}` overrides (Results, ConfirmDialog, QuizAttempt, Simulation, ExamSchedule, Subscribe, Subscription, Home, LockedOverlay). Align `QuestionCard.getOptionStyle` with the palette and remove its dead ternary.
- [ ] 🟠 **Create one accessible `Dialog` component**:
  - `role="dialog"`, `aria-modal` and `aria-labelledby`
  - initial focus, a focus trap, Escape to close and focus return

  Use it for ConfirmDialog, the Subscribe status modal and AnswerReviewModal. The review modal's global key handler also blocks ArrowUp/Down scrolling.
- [ ] 🟠 **Focus and contrast.**
  - Add a global `:focus-visible` ring; `.nav-tab` and TopBackButton remove the outline.
  - Fix colors that fail WCAG AA: `#9AA6B8` and `#8B9CA0` on white.
  - Raise text at 9–10px (badges, BottomNav) to at least 11–12px.
- [ ] 🟢 **Semantics.**
  - `aria-current` on BottomNav and the question navigator
  - `role="radio"` and `aria-checked` on MCQ options
  - labels for the fill-blank and essay inputs, and a `<label>` for the department select
  - `role="timer"` with a low-time announcement
  - a text alternative for the Performance chart bars
  - render the ChannelGate toast only while it is shown (now an always-present `role="status"`)
- [ ] 🟢 **`index.html` and fonts.**
  - Load Plus Jakarta Sans and Sora; they are declared but never loaded.
  - Set a real `<title>` and favicon.
  - Add `theme-color` and `viewport-fit=cover`, since the CSS uses safe-area insets.

---

## Phase 8 — Copy & polish

- [ ] 🟢 **Developer copy shown to students.** Replace "backend still stores a numeric period" (Onboarding), "real backend-driven quiz summaries" (Home) and "once backend content is available" (ResourceViewer).
- [ ] 🟢 **Hardcoded values.**
  - LockedOverlay's default price "ETB 99" should come from `/api/subscription/plans/`.
  - ChannelGate hardcodes `@unityuniversityportal` instead of deriving it from `channelUrl`.
  - The Program step uses a `Wifi` icon.
- [ ] 🟢 **ExamSchedule button label.** "Try Again Later" actually resets the search; rename it "Search again".
- [ ] 🟢 **Update docs.** Update `CODEX_CONTEXT.md` and `README.md` as phases land. README says lint passes, but lint currently checks nothing.

---

### Suggested grouping into PRs
1. Phase 0 (tooling and TS errors)
2. Phase 1 (one PR per area: quiz/exam, auth, resources)
3. Phase 2
4. Phase 3
5. Phase 4, after the viewer decision
6. Phases 5 and 6 together, refactoring while adding selectors
7. Phase 7
8. Phase 8
