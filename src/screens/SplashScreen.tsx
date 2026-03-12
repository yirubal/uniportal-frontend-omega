import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";

export default function SplashScreen() {
    const { error, isLoading } = useAuthStore();
    const { initAuth } = useAuth();

    return (
        <div
            style={{ backgroundColor: "#0A1628" }}
            className="fixed inset-0 flex flex-col items-center justify-center gap-0 animate-fade-in"
        >
            {/* Radial glow behind the logo */}
            <div
                className="absolute"
                style={{
                    width: 260,
                    height: 260,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, rgba(255,180,0,0.12) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            {/* Logo */}
            <div
                className="animate-scale-in flex items-center justify-center mb-6"
                style={{
                    width: 100,
                    height: 100,
                    borderRadius: 28,
                    background:
                        "linear-gradient(135deg, rgba(255,180,0,0.18) 0%, rgba(255,180,0,0.06) 100%)",
                    border: "1.5px solid rgba(255,180,0,0.35)",
                    fontSize: 52,
                    lineHeight: 1,
                    boxShadow: "0 8px 32px rgba(255,180,0,0.12)",
                }}
            >
                🎓
            </div>

            {/* App name */}
            <p
                className="animate-fade-in-up text-white font-bold tracking-tight"
                style={{
                    fontSize: 26,
                    animationDelay: "0.10s",
                    animationFillMode: "both",
                    opacity: 0,
                    letterSpacing: "-0.3px",
                }}
            >
                Unity University
            </p>

            {/* Subtitle */}
            <p
                className="animate-fade-in-up"
                style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "#FFB400",
                    opacity: 0,
                    animationDelay: "0.20s",
                    animationFillMode: "both",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                }}
            >
                Student Portal
            </p>

            {/* Error state */}
            {!isLoading && error ? (
                <div
                    className="animate-fade-in-up flex flex-col items-center gap-3"
                    style={{ marginTop: 48 }}
                >
                    <p
                        style={{
                            fontSize: 13,
                            color: "#FF6B6B",
                            textAlign: "center",
                            maxWidth: 240,
                            lineHeight: 1.5,
                        }}
                    >
                        {error}
                    </p>
                    <button
                        onClick={initAuth}
                        style={{
                            marginTop: 8,
                            padding: "10px 28px",
                            borderRadius: 12,
                            background: "linear-gradient(135deg, #FFB400, #FF8C00)",
                            color: "#0A1628",
                            fontWeight: 700,
                            fontSize: 14,
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 4px 16px rgba(255,180,0,0.3)",
                        }}
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                /* Loading dots */
                <div
                    className="animate-fade-in-up flex items-center gap-2"
                    style={{
                        marginTop: 48,
                        opacity: 0,
                        animationDelay: "0.35s",
                        animationFillMode: "both",
                    }}
                >
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            style={{
                                display: "inline-block",
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: "#FFB400",
                                animation: "pulse 1.2s ease-in-out infinite",
                                animationDelay: `${i * 0.18}s`,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
