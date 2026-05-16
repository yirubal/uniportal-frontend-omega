import { ArrowRight, BookOpenText, Brain, ChartColumn, FolderOpen, Sparkles, Target } from "lucide-react";
import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAccess } from "../hooks/useAccess";
import { formatDaysRemaining } from "../utils/format";
import { getPeriodLabel, getProgramLabel } from "../utils/periods";
import { useCallback, useEffect, useRef, useState } from "react";
import { getMyProfile } from "../api/auth";
import { getSubscriptionRequest, type SubscriptionRequestState } from "../api/quiz";
import { fetchActiveTerm } from "../api/exams";
import ExamScheduleCard from "../components/ExamScheduleCard";
import type { ActiveTermResponse } from "../types/exams";

const QUICK_ACTIONS = [
    {
        path: "/resources",
        icon: FolderOpen,
        label: "Resource Library",
        desc: "Browse notes, worksheets, and exam papers by course.",
        meta: "Study materials",
        tint: "bg-[#EAF4F1] text-[#3F6F6A]",
    },
    {
        path: "/quiz",
        icon: Brain,
        label: "Practice Hub",
        desc: "Choose quick quizzes or past exam papers from your current courses.",
        meta: "Quiz + past exam",
        tint: "bg-[#FFF6DF] text-[#B27614]",
    },
    {
        path: "/exit-exam",
        icon: Target,
        label: "Exit Exams",
        desc: "Choose timed exit exams, past years papers, or model exam practice.",
        meta: "Timed mode",
        tint: "bg-[#EAF8F1] text-[#2E9E73]",
    },
    {
        path: "/performance",
        icon: ChartColumn,
        label: "Performance",
        desc: "Review weak topics, progress, and score trends.",
        meta: "Premium insights",
        tint: "bg-[#F1EDFF] text-[#7654D6]",
    },
];

const BACKGROUND_REFRESH_THROTTLE_MS = 8000;

export default function HomeScreen() {
    const navigate = useNavigate();
    const { student, token, setAuth } = useAuthStore();
    const { isPremium, daysRemaining } = useAccess();
    const [subscriptionRequestState, setSubscriptionRequestState] = useState<SubscriptionRequestState | null>(null);
    const [activeTerm, setActiveTerm] = useState<ActiveTermResponse | null>(null);
    const backgroundRefreshInFlightRef = useRef(false);
    const lastBackgroundRefreshAtRef = useRef(0);
    // Stable refs so the effect never re-runs due to Zustand action/token identity changes
    const setAuthRef = useRef(setAuth);
    const tokenRef = useRef(token);
    useEffect(() => { setAuthRef.current = setAuth; }, [setAuth]);
    useEffect(() => { tokenRef.current = token; }, [token]);

    const greeting = "Selam";
    const currentRequestStatus = subscriptionRequestState?.current_request?.status;
    const hasPendingSubscriptionRequest = subscriptionRequestState?.has_pending_request === true || currentRequestStatus === "pending";
    const displayIsPremium = hasPendingSubscriptionRequest || currentRequestStatus === "rejected" ? false : isPremium;
    const statusBadgeLabel = displayIsPremium ? "Premium" : "Free";
    const statusBadgeClass = displayIsPremium ? "tone-green" : "tone-gold";
    const profileBadges = [
        getProgramLabel(student?.preferred_program),
        `Year ${student?.preferred_year ?? "?"}`,
        getPeriodLabel(student?.preferred_period, student?.preferred_program),
    ];

    const refreshHomeState = useCallback((force = false) => {
        if (backgroundRefreshInFlightRef.current) return;
        const now = Date.now();
        if (!force && now - lastBackgroundRefreshAtRef.current < BACKGROUND_REFRESH_THROTTLE_MS) return;

        backgroundRefreshInFlightRef.current = true;
        lastBackgroundRefreshAtRef.current = now;

        Promise.allSettled([
            getMyProfile({ skipGlobalLoader: true }),
            getSubscriptionRequest({ skipGlobalLoader: true, skipAuthClear: true }),
        ]).then(([profileResult, requestResult]) => {
            if (profileResult.status === "fulfilled" && tokenRef.current) {
                setAuthRef.current(tokenRef.current, profileResult.value);
            }

            if (requestResult.status === "fulfilled") {
                setSubscriptionRequestState(requestResult.value);
            }
        }).finally(() => {
            backgroundRefreshInFlightRef.current = false;
        });
    }, []); // stable — reads token/setAuth from refs

    useEffect(() => {
        const handleResume = () => {
            if (document.visibilityState === "visible") {
                refreshHomeState();
            }
        };

        refreshHomeState(true);
        const handleFocus = () => refreshHomeState();
        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleResume);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleResume);
        };
    }, [refreshHomeState]); // refreshHomeState is stable (useCallback with [])

    useEffect(() => {
        let active = true;

        fetchActiveTerm({ skipGlobalLoader: true, skipAuthClear: true })
            .then((term) => {
                if (active) {
                    setActiveTerm(term);
                }
            })
            .catch(() => {
                if (active) {
                    setActiveTerm(null);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#70868B]">
                            {greeting}
                        </p>
                        <h1 className="app-title mt-1 text-[1.55rem] font-bold text-[#172B2F]">
                            {student?.first_name ?? student?.name ?? "Student"}
                        </h1>
                        <p className="mt-1 text-sm text-[#526B70]">
                            Unity University student portal
                        </p>
                    </div>

                    <div className={`rounded-full px-3 py-2 text-xs font-bold ${statusBadgeClass}`}>
                        {statusBadgeLabel}
                    </div>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <div className="app-sheet p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="app-section-label">Current profile</p>
                            <p className="mt-1 text-sm text-[#526B70]">
                                Department-based content and exam prep
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {profileBadges.map((badge) => (
                                    <span
                                        key={badge}
                                        className="inline-flex items-center justify-center rounded-full bg-[#F4F8F5] px-3 py-2 text-xs font-semibold text-[#172B2F]"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="shrink-0 rounded-full bg-[#F4F8F5] px-3 py-2 text-xs font-semibold text-[#526B70]">
                            {hasPendingSubscriptionRequest ? "Payment request under review" : currentRequestStatus === "rejected" ? "Payment not confirmed" : displayIsPremium ? formatDaysRemaining(daysRemaining) : "Upgrade available"}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        {!displayIsPremium && (
                            <button
                                onClick={() => navigate("/subscribe")}
                                className="inline-flex items-center gap-2 rounded-full bg-[#172B2F] !px-4 py-3 text-sm font-semibold text-white sm:!px-12"
                                style={{ backgroundColor: "#172B2F", color: "#FFFFFF", paddingInline: "2.5rem" }}
                            >
                                {/* <Sparkles size={14} /> */}
                                {hasPendingSubscriptionRequest ? "View request status" : "Unlock premium tools"}
                            </button>
                        )}
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => navigate("/subscription")}
                            className="rounded-full"
                        >
                            <Sparkles size={16} />
                            Subscription
                        </Button>
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => navigate("/onboarding")}
                            className="rounded-full"
                        >
                            <BookOpenText size={16} />
                            Update setup
                        </Button>
                    </div>
                </div>

                <div className="mt-5">
                    <div className="mb-3 px-1">
                        <p className="app-section-label">Quick access</p>
                        <h2 className="mt-2 text-lg font-bold text-[#172B2F]">
                            Continue where you need to work
                        </h2>
                    </div>

                    <div className="space-y-3">
                        <ExamScheduleCard
                            term={activeTerm?.active ? activeTerm : null}
                            onClick={() => navigate("/exam-schedule")}
                        />
                        {QUICK_ACTIONS.map((action) => {
                            const Icon = action.icon;

                            return (
                                <button
                                    key={action.path}
                                    onClick={() => navigate(action.path)}
                                    className="app-list-item"
                                >
                                    <div className={`app-icon-chip ${action.tint}`}>
                                        <Icon size={20} strokeWidth={2.2} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-sm font-semibold text-[#172B2F]">
                                                {action.label}
                                            </p>
                                            <span className="inline-flex items-center justify-center rounded-full bg-[#F4F8F5] px-2.5 py-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#70868B]">
                                                {action.meta}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm leading-relaxed text-[#526B70]">
                                            {action.desc}
                                        </p>
                                    </div>

                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F8F5] text-[#172B2F]">
                                        <ArrowRight size={16} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-5 app-sheet p-4">
                    <p className="app-section-label">This week</p>
                    <div className="mt-3 grid gap-3">
                        <div className="rounded-[20px] bg-[#F6FAF7] px-4 py-3">
                            <p className="text-sm font-semibold text-[#172B2F]">
                                Keep resource browsing course-first
                            </p>
                            <p className="mt-1 text-sm text-[#526B70]">
                                Library and quizzes work best after department, program, year, and period are selected.
                            </p>
                        </div>
                        <div className="rounded-[20px] bg-[#F6FAF7] px-4 py-3">
                            <p className="text-sm font-semibold text-[#172B2F]">
                                Use practice for speed, simulations for pressure
                            </p>
                            <p className="mt-1 text-sm text-[#526B70]">
                                The app now supports real backend-driven quiz summaries and exit exam flows.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
