import { lazy, Suspense, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { initAuth } from "./hooks/useAuth";
import { useTelegramChrome } from "./hooks/useTelegramChrome";

import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import ChannelGateScreen from "./screens/ChannelGateScreen";
import BottomNav from "./components/BottomNav";
import { RouteFallback } from "./components/RouteFallback";
import SlowRequestLoader from "./components/SlowRequestLoader";

// Splash, Home and the channel gate are part of the first load; every other screen is fetched on demand.
// The PDF reader in particular pulls in pdf.js, so it only loads when a document is opened.
const OnboardingScreen = lazy(() => import("./screens/OnboardingScreen"));
const ResourcesScreen = lazy(() => import("./screens/ResourcesScreen"));
const ResourceViewerScreen = lazy(() => import("./screens/ResourceViewerScreen"));
const QuizScreen = lazy(() => import("./screens/QuizScreen"));
const PracticeSetupScreen = lazy(() => import("./screens/PracticeSetupScreen"));
const SelectivePracticeScreen = lazy(() => import("./screens/SelectivePracticeScreen"));
const QuizListScreen = lazy(() => import("./screens/QuizListScreen"));
const QuizAttemptScreen = lazy(() => import("./screens/QuizAttemptScreen"));
const ExitExamScreen = lazy(() => import("./screens/ExitExamScreen"));
const ExitExamListScreen = lazy(() => import("./screens/ExitExamListScreen"));
const SimulationScreen = lazy(() => import("./screens/SimulationScreen"));
const ResultsScreen = lazy(() => import("./screens/ResultsScreen"));
const PerformanceScreen = lazy(() => import("./screens/PerformanceScreen"));
const SubscriptionScreen = lazy(() => import("./screens/SubscriptionScreen"));
const SubscribeScreen = lazy(() => import("./screens/SubscribeScreen"));
const ExamSchedule = lazy(() => import("./screens/ExamSchedule"));
const PdfReaderScreen = lazy(() => import("./screens/PdfReaderScreen"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuthStore(
        useShallow((state) => ({
            isAuthenticated: state.isAuthenticated,
            isLoading: state.isLoading,
        }))
    );
    if (isLoading) return <SplashScreen />;
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    const { isAuthenticated, isLoading, student, channelRequired } = useAuthStore(
        useShallow((state) => ({
            isAuthenticated: state.isAuthenticated,
            isLoading: state.isLoading,
            student: state.student,
            channelRequired: state.channelRequired,
        }))
    );
    const location = useLocation();

    const hideBottomNav =
        location.pathname === "/onboarding" ||
        location.pathname.startsWith("/quiz/selective") ||
        location.pathname.startsWith("/quiz/take/") ||
        location.pathname.startsWith("/simulate/") ||
        location.pathname === "/results" ||
        /^\/resources\/[^/]+\/read$/.test(location.pathname);

    if (isLoading) return <SplashScreen />;

    // Channel membership gate — blocks all content until user joins
    if (channelRequired) return <ChannelGateScreen />;

    return (
        <>
            <SlowRequestLoader />
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                    {/* Public */}
                    <Route
                        path="/"
                        element={
                            isAuthenticated
                                ? student?.onboarding_complete
                                    ? <Navigate to="/home" replace />
                                    : <Navigate to="/onboarding" replace />
                                : <SplashScreen />
                        }
                    />

                    <Route
                        path="/onboarding"
                        element={
                            <ProtectedRoute>
                                <OnboardingScreen />
                            </ProtectedRoute>
                        }
                    />

                    {/* Main App */}
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <HomeScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/resources"
                        element={
                            <ProtectedRoute>
                                <ResourcesScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/resources/:id"
                        element={
                            <ProtectedRoute>
                                <ResourceViewerScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/resources/:id/read"
                        element={
                            <ProtectedRoute>
                                <PdfReaderScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/exam-schedule"
                        element={
                            <ProtectedRoute>
                                <ExamSchedule />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/quiz"
                        element={
                            <ProtectedRoute>
                                <QuizScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/quiz/setup"
                        element={
                            <ProtectedRoute>
                                <PracticeSetupScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/quiz/selective"
                        element={
                            <ProtectedRoute>
                                <SelectivePracticeScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/quiz/selective/take"
                        element={
                            <ProtectedRoute>
                                <QuizAttemptScreen selectiveMode />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/quiz/list"
                        element={
                            <ProtectedRoute>
                                <QuizListScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/quiz/take/:quizId"
                        element={
                            <ProtectedRoute>
                                <QuizAttemptScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/exit-exam"
                        element={
                            <ProtectedRoute>
                                <ExitExamScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/exit-exam/list/:category"
                        element={
                            <ProtectedRoute>
                                <ExitExamListScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/simulate/:examId"
                        element={
                            <ProtectedRoute>
                                <SimulationScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/results"
                        element={
                            <ProtectedRoute>
                                <ResultsScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/performance"
                        element={
                            <ProtectedRoute>
                                <PerformanceScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/subscription"
                        element={
                            <ProtectedRoute>
                                <SubscriptionScreen />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/subscribe"
                        element={
                            <ProtectedRoute>
                                <SubscribeScreen />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>

            {/* Bottom nav only shows on main screens */}
            {isAuthenticated && student?.onboarding_complete && !hideBottomNav && <BottomNav />}
        </>
    );
}

export default function App() {
    useTelegramChrome();
    const sessionExpired = useAuthStore((state) => state.sessionExpired);
    const reauthAttemptedRef = useRef(false);

    useEffect(() => {
        void initAuth();
    }, []);

    // After a 401, log in again once automatically (Telegram initData is still available).
    // If that fails too, SplashScreen shows the error with a "Try again" button.
    useEffect(() => {
        if (!sessionExpired || reauthAttemptedRef.current) return;
        reauthAttemptedRef.current = true;
        void initAuth();
    }, [sessionExpired]);

    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}
