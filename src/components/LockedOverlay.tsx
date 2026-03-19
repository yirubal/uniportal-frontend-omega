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
        <div
            className="px-5 pt-5"
        >
            <div className="app-panel min-h-[60vh] rounded-[32px] px-6 py-10 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF6DF] text-4xl">
                    🔒
                </div>

                <p className="app-section-label mb-2">Premium Access</p>
                <h2 className="app-title text-[1.7rem] font-bold text-[#18253D]">
                    {feature} is part of the premium study suite
                </h2>

                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#53627D]">
                    {description ||
                        `Upgrade to access ${feature} and all other premium features.`}
                </p>

                <div className="app-panel-muted mx-auto mt-7 w-full max-w-xs p-4 text-left">
                {[
                    "Unlimited downloads",
                    "Full exit exam archive",
                    "Performance tracker",
                    "All past exam papers",
                ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3 py-1.5">
                        <span className="text-[#2E9E73] text-base">✓</span>
                        <span className="text-sm text-[#18253D]">{benefit}</span>
                    </div>
                ))}
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="mt-7"
                    onClick={() => navigate("/subscribe")}
                >
                    Upgrade from {price}
                </Button>
            </div>
        </div>
    );
}
