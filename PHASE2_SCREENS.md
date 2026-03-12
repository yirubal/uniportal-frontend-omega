# Phase 2 — Screens

## Goal
All 11 screens built, connected to the API,
with proper loading states, error states, and access control.
App is fully functional end to end.

---

## Prerequisites
- All Phase 1 files complete ✅
- Backend API running at localhost:8000
- At least one test student + some resources in DB

---

## Screen Build Order
Build in this exact order — each screen depends on the previous:

1. SplashScreen       ← no dependencies
2. OnboardingScreen   ← needs contentStore + getDepartments API
3. HomeScreen         ← needs authStore + contentStore
4. ResourcesScreen    ← needs contentStore + getResources API
5. ResourceViewerScreen ← needs requestDownload + Watermark component
6. QuizScreen         ← needs quizStore + getQuestions API
7. ResultsScreen      ← needs quizStore results
8. SimulationScreen   ← needs quizStore simulation mode
9. ExitExamScreen     ← needs getExitExams API
10. PerformanceScreen ← needs getMyPerformance API
11. SubscribeScreen   ← needs getPlans + requestSubscription API

---

## Screen Specs

### SplashScreen
File: src/screens/SplashScreen.tsx
- Unity University logo (🎓 emoji, large)
- App name: "Unity University"
- Subtitle: "Student Portal"
- 3 animated loading dots (pulse animation, staggered)
- Deep navy background (#0A1628) with gold accents
- No logic — pure loading UI
- Used while auth is in progress

### OnboardingScreen
File: src/screens/OnboardingScreen.tsx
- 3 steps on one scrollable screen (not separate pages)
- Step 1: Department selector
  - Fetches from GET /api/departments/ on mount
  - Vertical list of selectable cards
  - Selected card: gold border + checkmark
- Step 2: Year selector (appears after dept selected)
  - Year 1 through Year 5 as pill chips
  - Selected pill: gold background, navy text
- Step 3: Semester selector (appears after year selected)
  - Two buttons: Semester I and Semester II
  - Full width side by side
- "Enter Portal" button:
  - Disabled until all 3 selected
  - On tap: PATCH /api/students/me/ with preferences
  - Sets onboarding_complete: true
  - Navigates to /home
- Smooth fade-in-up animation as each step appears

### HomeScreen
File: src/screens/HomeScreen.tsx
- Header: navy gradient, shows "Unity University" + dept/year/sem
- Welcome: "Good morning, {first_name} 👋"
- Subscription banner:
  - Free user: "Upgrade to Premium" gold banner
  - Premium user: "Premium · X days remaining" green banner
- 4 quick access cards in 2x2 grid:
  - 📁 Resources
  - 🧠 Quiz
  - 🎯 Exit Exam
  - 📊 Performance (locked icon if free)
- Each card navigates to its screen on tap
- Bottom padding for BottomNav

### ResourcesScreen
File: src/screens/ResourcesScreen.tsx
- Sticky header with search bar
- Horizontal scrollable course tabs
  - Fetches courses for selected dept/year/semester
  - Tapping a course tab loads its resources
- Filter chips below tabs:
  All / Lecture Notes / Worksheet / Past Exam / Exit Exam
- Resource list using ResourceCard component
  - Locked prop = true if resource.access_level === premium
    AND student is free
- Loading: show 4 skeleton cards
- Empty: EmptyState component
- Error: ErrorState component with retry

### ResourceViewerScreen
File: src/screens/ResourceViewerScreen.tsx
- Fetches resource detail on mount
- Shows title + type badge in header
- PDF viewer using react-pdf
  - Watermark component overlaid on every page
  - Page navigation (prev/next)
  - Page counter: "2 / 8"
- For free user viewing premium resource:
  - Page 1 fully visible
  - Pages 2+ show blur overlay + upgrade CTA
- Download button fixed at bottom:
  - Calls requestDownload(id) → gets signed URL
  - Calls WebApp.downloadFile(url, filename)
  - Shows loading spinner while requesting
  - Shows success haptic on complete
- Back button: WebApp.BackButton

### QuizScreen
File: src/screens/QuizScreen.tsx
- Course selector dropdown at top
- Mode tabs: Practice | By Topic
- Start button → fetches questions → enters quiz flow
- Uses QuestionCard component for each question
- Free user quota display: "3 of 5 free questions used today"
- After quota exceeded: show upgrade prompt instead of question
- "Next" button appears after answering
- On last question: "See Results" button
- Submits attempt on completion → navigates to /results

### ResultsScreen
File: src/screens/ResultsScreen.tsx
- Receives score data from quizStore
- Large score circle: percentage in center
- Emoji + message based on score (use getScoreEmoji/getScoreMessage)
- Row of green/red dots (one per question)
- Full answer review list:
  Each question: student answer, correct answer, explanation
  Color coded: green correct, red wrong
- Two buttons: "Try Again" | "Back to Home"

### SimulationScreen
File: src/screens/SimulationScreen.tsx
- Full screen, no bottom nav
- Countdown timer fixed at top (formatTimeRemaining)
- Uses QuestionCard with simulationMode=true (no answer reveal)
- Question number grid:
  - Tapping a number jumps to that question
  - Answered = navy dot, unanswered = grey dot
- "Submit Exam" button → WebApp.MainButton
- Confirm before submit: WebApp.showConfirm
- Auto-submits when timer hits 0
- On submit: POST /api/quiz/attempts/ → navigate to /results

### ExitExamScreen
File: src/screens/ExitExamScreen.tsx
- Full premium lock for free users (LockedOverlay component)
  with description: "Practice all past exit exams by year or topic"
  and price: "ETB 149"
- For premium users:
  - Hero banner: "Exit Exam Prep 🎯"
  - 3 mode cards:
    Full Simulation / Practice by Topic / Browse by Year
  - Year list: each year as a card with question count + duration
    Tapping year → two buttons: Practice (no timer) | Simulate (timed)
  - Topic grid: chips showing topic name + question count
    Tapping topic → quiz flow filtered by topic

### PerformanceScreen
File: src/screens/PerformanceScreen.tsx
- Full premium lock for free users (LockedOverlay component)
- For premium users:
  - Stats row: Total Attempts / Average Score / Best Score
  - Weak Topics section: list of topics below 50%
    Each topic: name + your average % + red badge
  - Score history list: date, course, score, mode
  - Simple score trend: CSS progress bars per attempt

### SubscribeScreen
File: src/screens/SubscribeScreen.tsx
- If already premium: show status card with expiry + renew option
- Plans fetched from GET /api/subscription/plans/
- 3 plan cards:
  - Semester Pass ETB 99 — "Most Popular" badge
  - Exit Exam Pass ETB 149 — "Best for Exit Exam" badge
  - Full Year Pass ETB 199 — "Best Value" badge
- Selected plan: gold border highlight
- "Continue" button → POST /api/subscription/request/
- Payment instructions screen (same page, conditional render):
  - Telebirr number
  - Reference code (e.g. UNI-00123) in copyable box
  - Step by step instructions
  - "I've sent the payment" button
  - Shows: "We'll activate your account within a few hours"

---

## Done When
- Full app flow works end to end in Telegram
- Free user hits quota → upgrade prompt shows
- Premium locked screens show LockedOverlay
- PDF viewer shows watermark on every page
- Download saves file to device
- Quiz submits and shows results correctly
- Simulation timer auto-submits at zero

---

## Antigravity Prompt Template
Use this at the start of every Antigravity session:
```
I am building a Telegram Mini App (uniportal-frontend).

Here is the full project context:
[paste PROJECT.md]

I need to build the following screen: [screen name]
Here are the specs: [paste the screen spec from above]

All imports, stores, hooks, components and API functions
are already built. Just build this one screen.

Use the design system colors from PROJECT.md.
The file goes in src/screens/[ScreenName].tsx.
Show me the complete file only — no explanations needed.
```

---

## Notes
_(add decisions here as you work)_