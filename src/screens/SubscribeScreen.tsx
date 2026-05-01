import { Check, CheckCircle2, Clock3, Sparkles, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlans, getSubscriptionRequest, requestSubscription, type PaymentInstructions, type Plan } from "../api/quiz";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import { formatETB } from "../utils/format";
import { useNavigate } from "react-router-dom";

export default function SubscribeScreen() {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"telebirr" | "cbe">("telebirr");
    const [paidFrom, setPaidFrom] = useState("");
    const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const hasOpenSubscriptionRequest = instructions?.status === "pending" || instructions?.status === "approved";
    const requestDisabled = !selectedPlan || !paidFrom.trim() || hasOpenSubscriptionRequest;
    const requestButtonLabel =
        instructions?.status === "approved"
            ? "Subscription already active"
            : instructions?.status === "pending"
                ? "Request already under review"
                : "Request subscription";
    const paymentReferenceCopy =
        paymentMethod === "telebirr"
            ? {
                label: "Payment reference",
                placeholder: "Phone number or Telebirr transaction ID",
                helper: "Use the phone number or transaction ID shown on your Telebirr receipt.",
            }
            : {
                label: "Payment reference",
                placeholder: "CBE transaction or receipt reference",
                helper: "CBE does not show the full sender account. Use the transaction/reference number from the receipt.",
            };

    useEffect(() => {
        Promise.all([getPlans(), getSubscriptionRequest()])
            .then(([items, pendingRequest]) => {
                setPlans(items);
                setSelectedPlan(items[1]?.id ?? items[0]?.id ?? null);
                if (pendingRequest) {
                    setInstructions(pendingRequest);
                    if (pendingRequest.status === "approved") {
                        setStatusModalOpen(true);
                    }
                }
            })
            .catch(() => setError("Failed to load subscription plans."))
            .finally(() => setLoading(false));
    }, []);

    const handleRequest = async () => {
        if (requestDisabled) {
            if (hasOpenSubscriptionRequest) {
                setStatusModalOpen(true);
            }
            return;
        }

        setRequesting(true);
        setError(null);
        setStatusModalOpen(true);

        try {
            const response = await requestSubscription(selectedPlan, paymentMethod, paidFrom.trim());
            setInstructions(response);
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
                                onClick={() => setPaymentMethod(method)}
                                style={paymentMethod === method ? { backgroundColor: "#3F6F6A", border: "1px solid #3F6F6A", color: "#FFFFFF" } : undefined}
                                className={`min-h-12 rounded-[18px] border px-4 text-sm font-bold transition-colors ${paymentMethod === method
                                    ? "border-[#3F6F6A] bg-[#3F6F6A] text-white"
                                    : "border-[rgba(23,43,47,0.10)] bg-white/80 text-[#172B2F]"
                                    }`}
                            >
                                {method === "telebirr" ? "Telebirr" : "CBE"}
                            </button>
                        ))}
                    </div>
                    <label className="mt-4 block">
                        <span className="app-section-label">{paymentReferenceCopy.label}</span>
                        <input
                            value={paidFrom}
                            onChange={(event) => setPaidFrom(event.target.value)}
                            placeholder={paymentReferenceCopy.placeholder}
                            className="app-input mt-3"
                        />
                        <span className="mt-2 block text-xs font-medium leading-relaxed text-[#526B70]">
                            {paymentReferenceCopy.helper}
                        </span>
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
                onClose={() => setStatusModalOpen(false)}
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

function SubscriptionInstructionsCard({ instructions }: { instructions: PaymentInstructions }) {
    const paymentOptions = instructions.payment_options ?? {};
    const summary = getPaymentInstructionSummary(instructions);
    const hasReferenceDetails = Boolean(instructions.reference || summary || instructions.note);
    const hasPaymentOptions = Boolean(paymentOptions.telebirr || paymentOptions.cbe);

    return (
        <div className="app-sheet p-5">
            <p className="app-section-label">
                {instructions.status === "pending" ? "Pending request" : "Payment instructions"}
            </p>
            {instructions.instructions && (
                <p className="mt-3 text-sm font-semibold leading-relaxed text-[#172B2F]">
                    {instructions.instructions}
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(10,22,40,0.46)] px-5 py-8">
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
            description: "Please wait while we submit your payment reference for review.",
            icon: Clock3,
            iconBg: "#EAF4F1",
            iconColor: "#3F6F6A",
        };
    }

    return {
        label: "Payment processing",
        title: "Your request is under review",
        description: "Your payment reference has been sent. Once the payment is confirmed, this screen will show that your subscription is active.",
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
