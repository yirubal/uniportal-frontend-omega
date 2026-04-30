import { Check, Sparkles } from "lucide-react";
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

    useEffect(() => {
        Promise.all([getPlans(), getSubscriptionRequest()])
            .then(([items, pendingRequest]) => {
                setPlans(items);
                setSelectedPlan(items[1]?.id ?? items[0]?.id ?? null);
                if (pendingRequest?.status === "pending") {
                    setInstructions(pendingRequest);
                }
            })
            .catch(() => setError("Failed to load subscription plans."))
            .finally(() => setLoading(false));
    }, []);

    const handleRequest = async () => {
        if (!selectedPlan || !paidFrom.trim()) return;

        setRequesting(true);
        setError(null);

        try {
            const response = await requestSubscription(selectedPlan, paymentMethod, paidFrom.trim());
            setInstructions(response);
        } catch {
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
                <div className="rounded-[24px] border border-[#172B2F] bg-[#172B2F] p-5 shadow-[0_18px_36px_rgba(23,43,47,0.14)]">
                    <div className="flex items-center gap-3">
                        <div className="app-icon-chip bg-[#FFF6DF] text-[#8B5C10]">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#BFE0D8]">
                                Premium includes
                            </p>
                            <p className="mt-1 text-base font-semibold text-white">Focused exam-prep tools</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        {[
                            "Unlimited downloads across all courses",
                            "Exit exam simulations and archives",
                            "Performance analytics and score trends",
                            "Premium worksheets and solved paper packs",
                        ].map((benefit) => (
                            <div
                                key={benefit}
                                className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.07] px-4 py-3"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF8F1] text-[#206F52]">
                                    <Check size={14} />
                                </div>
                                <p className="text-sm font-medium leading-snug text-[#F4FAF7]">{benefit}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="app-sheet p-5">
                    <p className="app-section-label">Plans</p>

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
                                        className={`w-full rounded-[22px] border p-4 text-left transition-colors ${
                                            isSelected
                                                ? "border-[#172B2F] bg-[#172B2F] shadow-[0_12px_28px_rgba(23,43,47,0.12)]"
                                                : "border-[rgba(23,43,47,0.10)] bg-white/80"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-[#172B2F]"}`}>
                                                        {plan.name}
                                                    </p>
                                                    {isSelected && (
                                                        <span className="rounded-full bg-[#EAF4F1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#234C48]">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`mt-1 text-sm leading-relaxed ${isSelected ? "text-[#D8EAE5]" : "text-[#3F5A60]"}`}>
                                                    {plan.description}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className={`text-lg font-black ${isSelected ? "text-white" : "text-[#172B2F]"}`}>
                                                    {formatETB(plan.price)}
                                                </p>
                                                <p className={`mt-1 text-xs font-semibold ${isSelected ? "text-[#BFE0D8]" : "text-[#526B70]"}`}>
                                                    {plan.days} days
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {instructions && (
                    <div className="app-sheet p-5">
                        <p className="app-section-label">
                            {instructions.status === "pending" ? "Pending request" : "Payment instructions"}
                        </p>
                        {instructions.instructions && (
                            <p className="mt-3 text-sm font-semibold leading-relaxed text-[#172B2F]">
                                {instructions.instructions}
                            </p>
                        )}
                        <div className="mt-4 rounded-[22px] border border-[#172B2F] bg-[#172B2F] p-4">
                            <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#BFE0D8]">
                                Reference
                            </p>
                            <p className="mt-2 text-lg font-bold text-white">{instructions.reference}</p>
                            <p className="mt-1 text-sm font-semibold text-[#F4FAF7]">
                                {instructions.plan} · {formatETB(instructions.amount)} · {instructions.days} days
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-[#D8EAE5]">{instructions.note}</p>
                        </div>

                        <div className="mt-4 grid gap-3">
                            {instructions.payment_options.telebirr && (
                                <PaymentOption
                                    label="Telebirr"
                                    primary={instructions.payment_options.telebirr.number}
                                    secondary={instructions.payment_options.telebirr.name}
                                />
                            )}
                            {instructions.payment_options.cbe && (
                                <PaymentOption
                                    label="CBE"
                                    primary={instructions.payment_options.cbe.account}
                                    secondary={instructions.payment_options.cbe.name}
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className="app-sheet p-5">
                    <p className="app-section-label">Payment method</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {(["telebirr", "cbe"] as const).map((method) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`min-h-12 rounded-[18px] border px-4 text-sm font-bold transition-colors ${
                                    paymentMethod === method
                                        ? "border-[#172B2F] bg-[#172B2F] text-white shadow-[0_10px_20px_rgba(23,43,47,0.10)]"
                                        : "border-[rgba(23,43,47,0.10)] bg-white/80 text-[#172B2F]"
                                }`}
                            >
                                {method === "telebirr" ? "Telebirr" : "CBE"}
                            </button>
                        ))}
                    </div>
                    <label className="mt-4 block">
                        <span className="app-section-label">Paid from</span>
                        <input
                            value={paidFrom}
                            onChange={(event) => setPaidFrom(event.target.value)}
                            placeholder={paymentMethod === "telebirr" ? "Phone number used for payment" : "Bank account used for payment"}
                            className="app-input mt-3"
                        />
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
                    disabled={!selectedPlan || !paidFrom.trim()}
                    onClick={() => void handleRequest()}
                >
                    Continue with premium
                </Button>
            </div>
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
