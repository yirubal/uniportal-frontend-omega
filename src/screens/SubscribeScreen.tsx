import { Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlans, requestSubscription, type PaymentInstructions, type Plan } from "../api/quiz";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import { formatETB } from "../utils/format";
import { useNavigate } from "react-router-dom";

export default function SubscribeScreen() {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getPlans()
            .then((items) => {
                setPlans(items);
                setSelectedPlan(items[1]?.id ?? items[0]?.id ?? null);
            })
            .catch(() => setError("Failed to load subscription plans."))
            .finally(() => setLoading(false));
    }, []);

    const handleRequest = async () => {
        if (!selectedPlan) return;

        setRequesting(true);
        setError(null);

        try {
            const response = await requestSubscription(selectedPlan);
            setInstructions(response);
        } catch {
            setError("Failed to generate payment instructions.");
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="app-screen">
            <div className="app-hero">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/home")} label="Home" />
                    <p className="app-section-label text-white/70">Premium access</p>
                    <h1 className="app-title mt-2 text-[2rem] font-bold text-white">Unlock the full study suite</h1>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/72">
                        Add deeper revision tools, performance tracking, and premium exam prep without crowding the free experience.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-tight space-y-4">
                <div className="app-panel rounded-[32px] p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-[18px] bg-[#FFF6DF] p-3 text-[#B27614]">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="app-section-label">Premium includes</p>
                            <p className="mt-1 text-base font-semibold text-[#18253D]">Built for focused exam preparation</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        {[
                            "Unlimited downloads across all courses",
                            "Exit exam simulations and archives",
                            "Performance analytics and score trends",
                            "Premium worksheets and solved paper packs",
                        ].map((benefit) => (
                            <div key={benefit} className="app-panel-muted flex items-center gap-3 rounded-[22px] px-4 py-3">
                                <div className="rounded-full bg-[#EAF8F1] p-1 text-[#2E9E73]">
                                    <Check size={14} />
                                </div>
                                <p className="text-sm text-[#18253D]">{benefit}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="app-panel rounded-[32px] p-5">
                    <p className="app-section-label">Plans</p>

                    {loading ? (
                        <div className="mt-4 space-y-3">
                            <Skeleton className="h-28 rounded-[28px]" />
                            <Skeleton className="h-28 rounded-[28px]" />
                        </div>
                    ) : error && plans.length === 0 ? (
                        <ErrorState message={error} onRetry={() => window.location.reload()} />
                    ) : (
                        <div className="mt-4 space-y-3">
                            {plans.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`w-full rounded-[28px] border p-4 text-left transition-colors ${selectedPlan === plan.id ? "border-[#2D5BFF] bg-[#EEF3FF]" : "border-[rgba(31,53,91,0.08)] bg-[rgba(248,250,255,0.82)]"}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-base font-semibold text-[#18253D]">{plan.name}</p>
                                            <p className="mt-1 text-sm leading-relaxed text-[#53627D]">{plan.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-[#18253D]">{formatETB(plan.price)}</p>
                                            <p className="mt-1 text-xs text-[#7F8CA5]">{plan.days} days</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {instructions && (
                    <div className="app-panel rounded-[32px] p-5">
                        <p className="app-section-label">Payment instructions</p>
                        <p className="mt-3 text-sm font-semibold leading-relaxed text-[#18253D]">
                            {instructions.instructions}
                        </p>
                        <div className="mt-4 app-panel-muted rounded-[24px] p-4">
                            <p className="app-section-label">Reference</p>
                            <p className="mt-2 text-lg font-bold text-[#18253D]">{instructions.reference}</p>
                            <p className="mt-3 text-sm leading-relaxed text-[#53627D]">{instructions.note}</p>
                        </div>
                    </div>
                )}

                {error && plans.length > 0 && <ErrorState message={error} />}
            </div>

            <div className="app-footer">
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={requesting}
                    disabled={!selectedPlan}
                    onClick={() => void handleRequest()}
                >
                    Continue with premium
                </Button>
            </div>
        </div>
    );
}
