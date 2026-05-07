import { CreditCard } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile } from "../api/auth";
import { getPlans, getSubscriptionRequest, type Plan, type SubscriptionRequestState } from "../api/quiz";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import { useAccess } from "../hooks/useAccess";
import { useAuthStore } from "../store/authStore";
import { formatDaysRemaining, formatETB } from "../utils/format";

export default function SubscriptionScreen() {
    const navigate = useNavigate();
    const { token, setAuth } = useAuthStore();
    const { isPremium, daysRemaining } = useAccess();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscriptionRequestState, setSubscriptionRequestState] = useState<SubscriptionRequestState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentRequestStatus = subscriptionRequestState?.current_request?.status;
    const currentPlanName = subscriptionRequestState?.current_request?.plan;
    const hasPendingSubscriptionRequest = subscriptionRequestState?.has_pending_request === true || currentRequestStatus === "pending";
    const displayIsPremium = hasPendingSubscriptionRequest || currentRequestStatus === "rejected" ? false : isPremium;
    const statusLabel = hasPendingSubscriptionRequest
        ? "Payment under review"
        : currentRequestStatus === "rejected"
            ? "Free plan"
            : displayIsPremium
                ? "Premium plan"
                : "Free plan";
    const statusDetail = hasPendingSubscriptionRequest
        ? "Your payment request is waiting for review."
        : currentRequestStatus === "rejected"
            ? "Your last payment was not confirmed. Submit a new request when ready."
            : displayIsPremium
                ? formatDaysRemaining(daysRemaining)
                : "Upgrade when you need premium resources and exam tools.";

    const refreshSubscriptionPage = useCallback(() => {
        setLoading(true);
        setError(null);

        Promise.allSettled([getPlans(), getSubscriptionRequest(), getMyProfile()])
            .then(([plansResult, requestResult, profileResult]) => {
                if (plansResult.status === "fulfilled") {
                    setPlans(plansResult.value);
                } else {
                    setError("Failed to load subscription plans.");
                }

                if (requestResult.status === "fulfilled") {
                    setSubscriptionRequestState(requestResult.value);
                }

                if (profileResult.status === "fulfilled" && token) {
                    setAuth(token, profileResult.value);
                }
            })
            .finally(() => setLoading(false));
    }, [setAuth, token]);

    useEffect(() => {
        refreshSubscriptionPage();
    }, [refreshSubscriptionPage]);

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/home")} label="Home" />
                    <p className="app-section-label">Subscription</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">Your access plan</h1>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#526B70]">
                        Check your current plan and choose when to request premium access.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact space-y-4">
                <section className="app-sheet p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="app-section-label">Current plan</p>
                            <h2 className="mt-2 text-xl font-black text-[#172B2F]">{statusLabel}</h2>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-[#526B70]">{statusDetail}</p>
                        </div>
                        <div className={`rounded-full px-3 py-2 text-xs font-bold ${displayIsPremium ? "tone-green" : "tone-gold"}`}>
                            {displayIsPremium ? "Premium" : "Free"}
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={() => navigate("/subscribe")}
                            style={{
                                backgroundColor: "#172B2F",
                                borderColor: "#172B2F",
                                color: "#FFFFFF",
                            }}
                        >
                            <CreditCard size={17} />
                            {hasPendingSubscriptionRequest ? "View request status" : "Request premium access"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="md"
                            fullWidth
                            onClick={refreshSubscriptionPage}
                            disabled={loading}
                        >
                            Refresh status
                        </Button>
                    </div>
                </section>

                <section className="app-sheet p-5">
                    <p className="app-section-label">Available plans</p>
                    <div className="mt-4 space-y-3">
                        {loading ? (
                            <>
                                <Skeleton className="h-28 rounded-[22px]" />
                                <Skeleton className="h-28 rounded-[22px]" />
                            </>
                        ) : error && plans.length === 0 ? (
                            <ErrorState message={error} onRetry={refreshSubscriptionPage} />
                        ) : (
                            plans.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    name={plan.name}
                                    description={plan.description}
                                    priceLabel={formatETB(plan.price)}
                                    durationLabel={`${plan.days} days`}
                                    selected={displayIsPremium && Boolean(currentPlanName) && (currentPlanName === plan.id || currentPlanName === plan.name)}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function PlanCard({
    name,
    description,
    priceLabel,
    durationLabel,
    selected,
}: {
    name: string;
    description: string;
    priceLabel: string;
    durationLabel: string;
    selected: boolean;
}) {
    return (
        <div className={`rounded-[22px] border p-4 ${selected ? "border-[#3F6F6A] bg-[#EAF4F1]" : "border-[rgba(23,43,47,0.10)] bg-white/85"}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-[#172B2F]">{name}</h3>
                        {selected && (
                            <span className="inline-flex items-center rounded-full bg-[#3F6F6A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                                Current
                            </span>
                        )}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#526B70]">{description}</p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-lg font-black text-[#172B2F]">{priceLabel}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#70868B]">{durationLabel}</p>
                </div>
            </div>

        </div>
    );
}
