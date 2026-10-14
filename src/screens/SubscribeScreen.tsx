import { Check, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPlans, requestSubscription, type Plan } from "../api/quiz";
import { PaymentDestinationCard, SubscriptionInstructionsCard } from "../components/subscribe/PaymentDetails";
import SubscriptionStatusModal from "../components/subscribe/SubscriptionStatusModal";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import { useSubscriptionStatus } from "../hooks/useSubscriptionStatus";
import { formatETB } from "../utils/format";

const PAYMENT_REFERENCE_PATTERN = /^[A-Z0-9]{10,12}$/;

export default function SubscribeScreen() {
    const navigate = useNavigate();
    // Re-syncs when the student comes back from their payment app.
    const { requestState, refresh, requestStatus, hasPendingRequest, currentRequest } = useSubscriptionStatus({ syncOnFocus: true });
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"telebirr" | "cbe">("telebirr");
    const [paymentReference, setPaymentReference] = useState("");
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const instructions = currentRequest;
    const currentRequestStatus = requestStatus;
    const hasPendingSubscriptionRequest = hasPendingRequest;
    const paymentOptions = instructions?.payment_options ?? requestState?.payment_options ?? {};
    const canUsePaymentMethod = paymentMethod === "telebirr" || Boolean(paymentOptions.cbe);
    const normalizedPaymentReference = paymentReference.trim().toUpperCase();
    const paymentReferenceValid = PAYMENT_REFERENCE_PATTERN.test(normalizedPaymentReference);
    const requestDisabled =
        !selectedPlan ||
        !paymentReferenceValid ||
        !canUsePaymentMethod ||
        hasPendingSubscriptionRequest ||
        currentRequestStatus === "approved";
    const requestButtonLabel =
        currentRequestStatus === "approved"
            ? "Payment confirmed"
            : currentRequestStatus === "rejected"
                ? "Resubmit request"
                : hasPendingSubscriptionRequest
                ? "Request already under review"
                : "Request subscription";
    const paymentReferenceCopy =
        paymentMethod === "telebirr"
            ? {
                label: "Telebirr transaction number",
                placeholder: "DCE4R6BZA0",
                helper: "Enter the 10-12 character transaction number from your Telebirr receipt.",
            }
            : {
                label: "CBE transaction ID",
                placeholder: "FT261187472K",
                helper: "Enter the 10-12 character transaction ID from your CBE receipt.",
            };
    const paymentReferenceError =
        paymentReference.length > 0 && !paymentReferenceValid
            ? "Use the 10-12 character transaction number or ID from your receipt."
            : "";

    const loadPage = useCallback(() => {
        Promise.allSettled([
            getPlans({ skipGlobalLoader: true, skipAuthClear: true }),
            refresh(),
        ])
            .then(([plansResult, requestResult]) => {
                if (plansResult.status === "fulfilled") {
                    setPlans(plansResult.value);
                    setSelectedPlan(plansResult.value[1]?.id ?? plansResult.value[0]?.id ?? null);
                } else {
                    setError("Failed to load subscription plans.");
                }

                // Open the status modal automatically only while a request is still under review,
                // not on every visit after an old approved or rejected request.
                if (requestResult.status === "fulfilled" && requestResult.value?.current_request?.status === "pending") {
                    setStatusModalOpen(true);
                }
            })
            .finally(() => setLoading(false));
    }, [refresh]);

    useEffect(() => {
        loadPage();
    }, [loadPage]);

    const handleRequest = async () => {
        if (requestDisabled) {
            if (currentRequest) {
                setStatusModalOpen(true);
            }
            return;
        }

        if (!selectedPlan) return;

        setRequesting(true);
        setError(null);
        setStatusModalOpen(true);

        try {
            await requestSubscription(selectedPlan, paymentMethod, normalizedPaymentReference);
            await refresh({ force: true });
        } catch {
            setStatusModalOpen(false);
            setError("Failed to generate payment instructions.");
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/home")} label="Home" />
                    <p className="app-section-label">Premium access</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">Unlock the full study suite</h1>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#526B70]">
                        Keep subscription choices simple, clear, and fast to scan inside Telegram.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact space-y-4">
                <div className="app-sheet p-5">
                    <div className="flex items-center gap-3">
                        <div className="app-icon-chip bg-[#FFF6DF] text-[#B27614]">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="app-section-label">Premium includes</p>
                            <p className="mt-1 text-base font-semibold text-[#172B2F]">Focused exam-prep tools</p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                        {[
                            "Unlimited downloads across all courses",
                            "Exit exam simulations and archives",
                            "Performance analytics and score trends",
                            "Premium worksheets and solved paper packs",
                        ].map((benefit) => (
                            <div
                                key={benefit}
                                className="flex items-center gap-3 rounded-[18px] border border-[rgba(23,43,47,0.08)] bg-[#F6FAF7] px-4 py-3"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF8F1] text-[#2E9E73]">
                                    <Check size={14} />
                                </div>
                                <p className="text-sm font-medium leading-snug text-[#172B2F]">{benefit}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="app-sheet p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="app-section-label">Plans</p>
                            <p className="mt-2 text-sm leading-relaxed text-[#526B70]">
                                Pick the access window that fits your study schedule.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="mt-4 space-y-3">
                            <Skeleton className="h-28 rounded-[24px]" />
                            <Skeleton className="h-28 rounded-[24px]" />
                        </div>
                    ) : error && plans.length === 0 ? (
                        <ErrorState
                            message={error}
                            onRetry={() => {
                                setLoading(true);
                                setError(null);
                                loadPage();
                            }}
                        />
                    ) : (
                        <div className="mt-4 space-y-3">
                            {plans.map((plan) => {
                                const isSelected = selectedPlan === plan.id;

                                return (
                                    <button
                                        type="button"
                                        key={plan.id}
                                        aria-pressed={isSelected}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`w-full rounded-[22px] border p-4 text-left transition-colors ${isSelected
                                            ? "border-[#3F6F6A] bg-[#EAF4F1]"
                                            : "border-[rgba(23,43,47,0.10)] bg-white/85"
                                            }`}
                                    >
                                        <div className="flex min-w-0 flex-col gap-3">
                                            <div className="min-w-0 py-2">
                                                <p className="break-words text-sm font-semibold leading-snug text-[#172B2F]">
                                                    {plan.name}
                                                </p>
                                                <p className="mt-1 break-words text-sm leading-relaxed text-[#3F5A60]">
                                                    {plan.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 border-t border-[rgba(23,43,47,0.08)] pt-3 py-2 px-1">
                                                <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${isSelected
                                                    ? "bg-[#3F6F6A] text-white"
                                                    : "bg-[#F4F8F5] text-[#526B70]"
                                                    }`}>
                                                    {isSelected ? "Selected" : `${plan.days} days`}
                                                </span>
                                                <div className="shrink-0 text-right px-6">
                                                    <p className="text-lg font-black leading-tight text-[#172B2F]">
                                                        {formatETB(plan.price)}
                                                    </p>
                                                    {isSelected && (
                                                        <p className="mt-0.5 text-xs font-semibold text-[#526B70]">
                                                            {plan.days} days
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {instructions && <SubscriptionInstructionsCard instructions={instructions} />}

                <div className="app-sheet p-5">
                    <p className="app-section-label">Payment method</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {(["telebirr", "cbe"] as const).map((method) => (
                            <button
                                key={method}
                                type="button"
                                disabled={method === "cbe" && !paymentOptions.cbe}
                                onClick={() => setPaymentMethod(method)}
                                style={paymentMethod === method ? { backgroundColor: "#3F6F6A", border: "1px solid #3F6F6A", color: "#FFFFFF" } : undefined}
                                className={`min-h-12 rounded-[18px] border px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:border-[#D5E1DD] disabled:bg-[#EEF4F1] disabled:text-[#809398] ${paymentMethod === method
                                    ? "border-[#3F6F6A] bg-[#3F6F6A] text-white"
                                    : "border-[rgba(23,43,47,0.10)] bg-white/80 text-[#172B2F]"
                                    }`}
                            >
                                {method === "telebirr" ? "Telebirr" : "CBE"}
                            </button>
                        ))}
                    </div>
                    <PaymentDestinationCard paymentMethod={paymentMethod} paymentOptions={paymentOptions} />
                    <label className="mt-4 block">
                        <span className="app-section-label">{paymentReferenceCopy.label}</span>
                        <input
                            value={paymentReference}
                            onChange={(event) => {
                                setPaymentReference(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                            }}
                            placeholder={paymentReferenceCopy.placeholder}
                            className="app-input mt-3"
                            autoCapitalize="characters"
                            autoCorrect="off"
                            inputMode="text"
                            maxLength={12}
                            pattern="[A-Z0-9]*"
                        />
                        <span className="mt-2 block text-xs font-medium leading-relaxed text-[#526B70]">
                            {paymentReferenceCopy.helper}
                        </span>
                        {paymentReferenceError && (
                            <span className="mt-2 block text-xs font-bold leading-relaxed text-[#B4473F]">
                                {paymentReferenceError}
                            </span>
                        )}
                    </label>
                </div>

                {error && plans.length > 0 && <ErrorState message={error} />}
            </div>

            <div className="app-footer">
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={requesting}
                    disabled={requestDisabled}
                    onClick={() => void handleRequest()}
                    style={{
                        backgroundColor: requestDisabled ? "#D5E1DD" : "#172B2F",
                        borderColor: requestDisabled ? "#D5E1DD" : "#172B2F",
                        color: requestDisabled ? "#344E53" : "#FFFFFF",
                    }}
                >
                    {requestButtonLabel}
                </Button>
            </div>

            <SubscriptionStatusModal
                open={statusModalOpen}
                requesting={requesting}
                instructions={instructions}
                onClose={() => {
                    // Closing mid-submit would hide the result of a payment request; wait for it.
                    if (requesting) return;
                    setStatusModalOpen(false);
                    void refresh();
                }}
            />
        </div>
    );
}
