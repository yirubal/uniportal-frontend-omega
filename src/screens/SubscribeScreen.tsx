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

                    <div className="mt-5 space-y-3">
                        {[
                            "Unlimited downloads across all courses",
                            "Exit exam simulations and archives",
                            "Performance analytics and score trends",
                            "Premium worksheets and solved paper packs",
                        ].map((benefit) => (
                            <div key={benefit} className="app-list-item">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF8F1] text-[#2E9E73]">
                                    <Check size={14} />
                                </div>
                                <p className="text-sm text-[#172B2F]">{benefit}</p>
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
                            {plans.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`w-full rounded-[24px] border p-4 text-left transition-colors ${selectedPlan === plan.id ? "border-[#3F6F6A] bg-[#EAF4F1]" : "border-[rgba(23,43,47,0.08)] bg-[rgba(244,247,252,0.82)]"}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-[#172B2F]">{plan.name}</p>
                                            <p className="mt-1 text-sm leading-relaxed text-[#526B70]">{plan.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-[#172B2F]">{formatETB(plan.price)}</p>
                                            <p className="mt-1 text-xs text-[#70868B]">{plan.days} days</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
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
                        <div className="mt-4 rounded-[22px] bg-[#F4F8F5] p-4">
                            <p className="app-section-label">Reference</p>
                            <p className="mt-2 text-lg font-bold text-[#172B2F]">{instructions.reference}</p>
                            <p className="mt-1 text-sm font-semibold text-[#172B2F]">
                                {instructions.plan} · {formatETB(instructions.amount)} · {instructions.days} days
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-[#526B70]">{instructions.note}</p>
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
                                        ? "border-[#172B2F] bg-[#172B2F] text-white"
                                        : "border-[rgba(23,43,47,0.08)] bg-[#F4F8F5] text-[#172B2F]"
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
        <div className="rounded-[20px] border border-[rgba(23,43,47,0.08)] bg-white/70 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#70868B]">{label}</p>
            <p className="mt-1 text-sm font-bold text-[#172B2F]">{primary}</p>
            <p className="mt-1 text-xs font-semibold text-[#526B70]">{secondary}</p>
        </div>
    );
}
