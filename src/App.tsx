import { useEffect } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useAuth } from "./hooks/useAuth";
import { useTelegramChrome } from "./hooks/useTelegramChrome";

import SplashScreen from "./screens/SplashScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import HomeScreen from "./screens/HomeScreen";
import ResourcesScreen from "./screens/ResourcesScreen";
import ResourceViewerScreen from "./screens/ResourceViewerScreen";
import QuizScreen from "./screens/QuizScreen";
import PracticeSetupScreen from "./screens/PracticeSetupScreen";
import QuizListScreen from "./screens/QuizListScreen";
import QuizAttemptScreen from "./screens/QuizAttemptScreen";
import ExitExamScreen from "./screens/ExitExamScreen";
import ExitExamListScreen from "./screens/ExitExamListScreen";
import SimulationScreen from "./screens/SimulationScreen";
import ResultsScreen from "./screens/ResultsScreen";
import PerformanceScreen from "./screens/PerformanceScreen";
import SubscribeScreen from "./screens/SubscribeScreen";
import BottomNav from "./components/BottomNav";
import SlowRequestLoader from "./components/SlowRequestLoader";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuthStore();
    if (isLoading) return <SplashScreen />;
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    const { isAuthenticated, isLoading, student } = useAuthStore();
    const location = useLocation();

    const hideBottomNav =
        location.pathname === "/onboarding" ||
        location.pathname.startsWith("/quiz/take/") ||
        location.pathname.startsWith("/simulate/") ||
        location.pathname === "/results";

    if (isLoading) return <SplashScreen />;

    return (
        <>
            <SlowRequestLoader />
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

            {/* Bottom nav only shows on main screens */}
            {isAuthenticated && student?.onboarding_complete && !hideBottomNav && <BottomNav />}
        </>
    );
}

export default function App() {
    const { initAuth } = useAuth();
    useTelegramChrome();

    useEffect(() => {
        initAuth();
    }, []);

    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}
