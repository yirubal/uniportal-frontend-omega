import { useNavigate } from "react-router-dom";
import { getPlans } from "../api/quiz";
import { useAsyncData } from "../hooks/useAsyncData";
import { formatETB } from "../utils/format";
import Button from "./ui/Button";

interface LockedOverlayProps {
    feature: string;
    description?: string;
}

export default function LockedOverlay({
    feature,
    description,
}: LockedOverlayProps) {
    const navigate = useNavigate();
    // Real starting price from the plans API; plain label while it loads or if it fails.
    const plans = useAsyncData("subscription-plans", (signal) =>
        getPlans({ skipGlobalLoader: true, skipAuthClear: true, signal })
    );
    const cheapest = plans.data?.length ? Math.min(...plans.data.map((plan) => plan.price)) : null;

    return (
        <div className="px-1 pt-2">
            <div className="app-state min-h-[50vh]">
                <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full bg-gold-tint text-4xl">
                    🔒
                </div>

                <p className="app-section-label mb-2">Premium Access</p>
                <h2 className="app-title text-[1.45rem] font-bold text-ink">
                    {feature} is part of the premium study suite
                </h2>

                <p className="app-copy mx-auto mt-3 max-w-xs">
                    {description ||
                        `Upgrade to access ${feature} and all other premium features.`}
                </p>

                <div className="app-panel-muted mx-auto mt-6 w-full max-w-xs rounded-[20px] p-4 text-left">
                {[
                    "Unlimited downloads",
                    "Full exit exam archive",
                    "Performance tracker",
                    "All past exam papers",
                ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3 py-1.5">
                        <span className="text-ok-ink text-base">✓</span>
                        <span className="text-sm text-ink">{benefit}</span>
                    </div>
                ))}
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="mt-6"
                    onClick={() => navigate("/subscribe")}
                >
                    {cheapest !== null ? `Upgrade from ${formatETB(cheapest)}` : "See premium plans"}
                </Button>
            </div>
        </div>
    );
}
