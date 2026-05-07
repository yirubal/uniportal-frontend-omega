import { Check, CheckCircle2, Clock3, Sparkles, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getPlans, getSubscriptionRequest, requestSubscription, type PaymentInstructions, type PaymentOptions, type Plan, type SubscriptionRequestState } from "../api/quiz";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import { formatETB } from "../utils/format";
import { useNavigate } from "react-router-dom";
import { getMyProfile } from "../api/auth";
import { useAuthStore } from "../store/authStore";

const PAYMENT_REFERENCE_PATTERN = /^[A-Z0-9]{10,12}$/;

export default function SubscribeScreen() {
    const navigate = useNavigate();
    const { token, setAuth } = useAuthStore();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"telebirr" | "cbe">("telebirr");
    const [paymentReference, setPaymentReference] = useState("");
    const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
    const [subscriptionRequestState, setSubscriptionRequestState] = useState<SubscriptionRequestState | null>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const currentRequestStatus = subscriptionRequestState?.current_request?.status ?? instructions?.status;
    const hasPendingSubscriptionRequest = subscriptionRequestState?.has_pending_request === true || currentRequestStatus === "pending";
    const paymentOptions = instructions?.payment_options ?? subscriptionRequestState?.payment_options ?? {};
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
                ? "Payment not confirmed"
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

    const applySubscriptionRequestState = useCallback((state: SubscriptionRequestState, openModal = false) => {
        setSubscriptionRequestState(state);
        setInstructions(state.current_request);

        if (openModal && state.current_request) {
            setStatusModalOpen(true);
        }
    }, []);

    const refreshSubscriptionState = useCallback(async (openModal = false) => {
        const [profileResult, requestResult] = await Promise.allSettled([getMyProfile(), getSubscriptionRequest()]);

        if (profileResult.status === "fulfilled" && token) {
            setAuth(token, profileResult.value);
        }

        if (requestResult.status === "fulfilled") {
            applySubscriptionRequestState(requestResult.value, openModal);
        }
    }, [applySubscriptionRequestState, setAuth, token]);

    useEffect(() => {
        Promise.allSettled([getPlans(), getSubscriptionRequest(), getMyProfile()])
            .then(([plansResult, requestResult, profileResult]) => {
                if (plansResult.status === "fulfilled") {
                    setPlans(plansResult.value);
                    setSelectedPlan(plansResult.value[1]?.id ?? plansResult.value[0]?.id ?? null);
                } else {
                    setError("Failed to load subscription plans.");
                }

                if (requestResult.status === "fulfilled") {
                    applySubscriptionRequestState(requestResult.value, Boolean(requestResult.value.current_request));
                }

                if (profileResult.status === "fulfilled" && token) {
                    setAuth(token, profileResult.value);
                }
            })
            .finally(() => setLoading(false));
    }, [applySubscriptionRequestState, setAuth, token]);

    useEffect(() => {
        const handleFocus = () => {
            void refreshSubscriptionState();
        };

        const handleResume = () => {
            if (document.visibilityState === "visible") {
                void refreshSubscriptionState();
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleResume);

        return () => {
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleResume);
        };
    }, [refreshSubscriptionState]);

    const handleRequest = async () => {
        if (requestDisabled) {
            if (subscriptionRequestState?.current_request) {
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
            await refreshSubscriptionState(true);
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
                        <ErrorState message={error} onRetry={() => window.location.reload()} />
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
                        className="mt-5"
                    >
                        {requestButtonLabel}
                    </Button>
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
                    setStatusModalOpen(false);
                    void refreshSubscriptionState();
                }}
            />
        </div>
    );
}

function PaymentOption({ label, primary, secondary }: { label: string; primary: string; secondary: string }) {
    return (
        <div className="rounded-[20px] border border-[rgba(23,43,47,0.10)] bg-white/85 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#526B70]">{label}</p>
            <p className="mt-1 text-sm font-bold text-[#172B2F]">{primary}</p>
            <p className="mt-1 text-xs font-semibold text-[#354F55]">{secondary}</p>
        </div>
    );
}

function PaymentDestinationCard({
    paymentMethod,
    paymentOptions,
}: {
    paymentMethod: "telebirr" | "cbe";
    paymentOptions: PaymentOptions;
}) {
    const destination =
        paymentMethod === "telebirr"
            ? {
                label: "Send Telebirr to",
                primary: paymentOptions.telebirr?.number ?? "Telebirr number not loaded",
                secondary: paymentOptions.telebirr?.name ?? "Refresh the page if this does not appear.",
            }
            : {
                label: "Send CBE transfer to",
                primary: paymentOptions.cbe?.account ?? "CBE is not available right now",
                secondary: paymentOptions.cbe?.name ?? "Choose Telebirr or check again later.",
            };

    return (
        <div className="mt-4 rounded-[22px] border border-[#CFE2DE] bg-[#EAF4F1] p-4">
            <p className="app-section-label">{destination.label}</p>
            <p className="mt-2 break-words text-lg font-black leading-tight text-[#172B2F]">
                {destination.primary}
            </p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-[#354F55]">
                {destination.secondary}
            </p>
        </div>
    );
}

function SubscriptionInstructionsCard({ instructions }: { instructions: PaymentInstructions }) {
    const paymentOptions = instructions.payment_options ?? {};
    const summary = getPaymentInstructionSummary(instructions);
    const hasReferenceDetails = Boolean(instructions.reference || summary || instructions.note);
    const hasPaymentOptions = Boolean(paymentOptions.telebirr || paymentOptions.cbe);
    const fallbackMessage =
        instructions.status === "pending"
            ? "Your payment request is under review. Please be patient; we will notify you by the bot once your payment is confirmed."
            : "";

    return (
        <div className="app-sheet p-5">
            <p className="app-section-label">
                {instructions.status === "pending" ? "Pending request" : "Payment instructions"}
            </p>
            {(instructions.instructions || fallbackMessage) && (
                <p className="mt-3 text-sm font-semibold leading-relaxed text-[#172B2F]">
                    {instructions.instructions ?? fallbackMessage}
                </p>
            )}
            {hasReferenceDetails && (
                <div className="mt-4 rounded-[22px] border border-[#CFE2DE] bg-[#EAF4F1] p-4">
                    {instructions.reference && (
                        <>
                            <p className="app-section-label">Reference</p>
                            <p className="mt-2 break-words text-lg font-bold text-[#172B2F]">{instructions.reference}</p>
                        </>
                    )}
                    {summary && (
                        <p className="mt-1 text-sm font-semibold text-[#172B2F]">
                            {summary}
                        </p>
                    )}
                    {instructions.note && (
                        <p className="mt-3 text-sm leading-relaxed text-[#526B70]">{instructions.note}</p>
                    )}
                </div>
            )}

            {hasPaymentOptions && (
                <div className="mt-4 grid gap-3">
                    {paymentOptions.telebirr && (
                        <PaymentOption
                            label="Telebirr"
                            primary={paymentOptions.telebirr.number}
                            secondary={paymentOptions.telebirr.name}
                        />
                    )}
                    {paymentOptions.cbe && (
                        <PaymentOption
                            label="CBE"
                            primary={paymentOptions.cbe.account}
                            secondary={paymentOptions.cbe.name}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function SubscriptionStatusModal({
    open,
    requesting,
    instructions,
    onClose,
}: {
    open: boolean;
    requesting: boolean;
    instructions: PaymentInstructions | null;
    onClose: () => void;
}) {
    if (!open) return null;

    const status = requesting ? "submitting" : instructions?.status ?? "pending";
    const config = getSubscriptionStatusConfig(status);
    const Icon = config.icon;
    const summary = instructions ? getPaymentInstructionSummary(instructions) : "";
    const hasInstructionDetails = Boolean(instructions?.reference || summary);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(10,22,40,0.46)] px-5 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] pt-8">
            <div className="relative w-full max-w-[20rem] rounded-[24px] border border-[rgba(23,43,47,0.08)] bg-[rgba(248,250,253,0.98)] p-4 shadow-[0_18px_44px_rgba(10,22,40,0.20)] backdrop-blur-xl">
                <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F8F5] text-[#526B70]"
                    style={{ backgroundColor: "#F4F8F5", color: "#526B70" }}
                >
                    <X size={16} />
                </button>
                <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: config.iconBg, color: config.iconColor }}
                >
                    <Icon size={22} className={requesting ? "animate-spin" : ""} />
                </div>
                <p className="app-section-label mt-4 text-center">{config.label}</p>
                <h2 className="mt-2 text-center text-lg font-bold text-[#172B2F]">{config.title}</h2>
                <p className="mt-2 text-center text-xs font-medium leading-relaxed text-[#526B70]">
                    {config.description}
                </p>
                {hasInstructionDetails && !requesting && instructions && (
                    <div className="mt-4 rounded-[18px] border border-[#CFE2DE] bg-[#EAF4F1] px-3.5 py-3">
                        {instructions.reference && (
                            <>
                                <p className="app-section-label">Reference</p>
                                <p className="mt-1 break-words text-sm font-bold text-[#172B2F]">{instructions.reference}</p>
                            </>
                        )}
                        {summary && (
                            <p className="mt-1 text-xs font-semibold text-[#354F55]">{summary}</p>
                        )}
                    </div>
                )}
                <div className="mt-4 grid gap-2">
                    <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        disabled={requesting}
                        onClick={onClose}
                        style={{
                            backgroundColor: requesting ? "#D5E1DD" : "#172B2F",
                            borderColor: requesting ? "#D5E1DD" : "#172B2F",
                            color: requesting ? "#344E53" : "#FFFFFF",
                        }}
                    >
                        {requesting ? "Submitting..." : "Done"}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        onClick={onClose}
                        style={{
                            backgroundColor: "#F4F8F5",
                            borderColor: "rgba(23,43,47,0.08)",
                            color: "#172B2F",
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}

function getSubscriptionStatusConfig(status: PaymentInstructions["status"] | "submitting") {
    if (status === "approved") {
        return {
            label: "Payment confirmed",
            title: "Your subscription is active",
            description: "Your payment has been confirmed. Premium study resources are now available on your account.",
            icon: CheckCircle2,
            iconBg: "#EAF8F1",
            iconColor: "#2E9E73",
        };
    }

    if (status === "rejected") {
        return {
            label: "Payment not confirmed",
            title: "We could not confirm this payment",
            description: "Please check your payment reference and submit the correct receipt or transaction reference again.",
            icon: XCircle,
            iconBg: "#FFF0ED",
            iconColor: "#D95A50",
        };
    }

    if (status === "submitting") {
        return {
            label: "Requesting subscription",
            title: "Sending your request",
            description: "Please wait while we submit your payment reference for review. We will notify you by the bot after it is checked.",
            icon: Clock3,
            iconBg: "#EAF4F1",
            iconColor: "#3F6F6A",
        };
    }

    return {
        label: "Payment processing",
        title: "Your request is under review",
        description: "Your payment request is under review. Please be patient; we will notify you by the bot once your payment is confirmed.",
        icon: Clock3,
        iconBg: "#EAF4F1",
        iconColor: "#3F6F6A",
    };
}

function getPaymentInstructionSummary(instructions: PaymentInstructions) {
    const parts = [
        instructions.plan,
        typeof instructions.amount === "number" ? formatETB(instructions.amount) : null,
        typeof instructions.days === "number" ? `${instructions.days} days` : null,
    ].filter(Boolean);

    return parts.join(" · ");
}
