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
            className="flex flex-col items-center justify-center
                 min-h-[60vh] px-6 text-center"
        >
            <div
                className="w-20 h-20 rounded-full bg-[#FFF8E1]
                   flex items-center justify-center text-4xl mb-5"
            >
                🔒
            </div>

            <h2 className="text-xl font-bold text-[#0A1628] mb-2">
                {feature} is Premium
            </h2>

            <p className="text-sm text-[#555] mb-6 max-w-xs leading-relaxed">
                {description ||
                    `Upgrade to access ${feature} and all other premium features.`}
            </p>

            <div className="bg-[#F5F7FA] rounded-2xl p-4 w-full max-w-xs mb-6">
                {[
                    "Unlimited downloads",
                    "Full exit exam archive",
                    "Performance tracker",
                    "All past exam papers",
                ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3 py-1.5">
                        <span className="text-[#4CAF50] text-base">✓</span>
                        <span className="text-sm text-[#333]">{benefit}</span>
                    </div>
                ))}
            </div>

            <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => navigate("/subscribe")}
            >
                Upgrade from {price} →
            </Button>
        </div>
    );
}