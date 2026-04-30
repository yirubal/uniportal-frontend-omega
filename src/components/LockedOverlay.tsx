import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";

interface LockedOverlayProps {
    feature: string;
    description?: string;
    price?: string;
}

export default function LockedOverlay({
    feature,
    description,
    price = "ETB 99",
}: LockedOverlayProps) {
    const navigate = useNavigate();

    return (
        <div className="px-1 pt-2">
            <div className="app-state min-h-[50vh]">
                <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full bg-[rgba(242,236,221,0.96)] text-4xl">
                    🔒
                </div>

                <p className="app-section-label mb-2">Premium Access</p>
                <h2 className="app-title text-[1.45rem] font-bold text-[#172B2F]">
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
                        <span className="text-[#2E7C62] text-base">✓</span>
                        <span className="text-sm text-[#172B2F]">{benefit}</span>
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
                    Upgrade from {price}
                </Button>
            </div>
        </div>
    );
}
