import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useAuth } from "../hooks/useAuth";

type ToastState = "idle" | "checking" | "not-joined";

export default function ChannelGateScreen() {
    const { channelUrl } = useAuthStore();
    const { initAuth } = useAuth();
    const [toast, setToast] = useState<ToastState>("idle");

    function onJoinChannel() {
        const tg = (window as Window & { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } }).Telegram?.WebApp;
        const url = channelUrl ?? "https://t.me/unityuniversityportal";
        if (tg?.openTelegramLink) {
            tg.openTelegramLink(url);
        } else {
            // Fallback for non-Telegram environments (dev)
            window.open(url, "_blank", "noopener,noreferrer");
        }
    }

    async function onCheckJoined() {
        setToast("checking");
        const prevChannelRequired = useAuthStore.getState().channelRequired;
        await initAuth();
        // If still channelRequired after auth, they haven't joined
        const stillRequired = useAuthStore.getState().channelRequired;
        if (stillRequired && prevChannelRequired) {
            setToast("not-joined");
            setTimeout(() => setToast("idle"), 3500);
        }
    }

    const isChecking = toast === "checking";

    return (
        <div className="app-screen items-center justify-center px-5 text-center" style={{ animation: "fadeIn 0.35s ease forwards" }}>
            {/* Ambient gradients */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle at 20% 10%, rgba(63,111,106,0.18) 0%, transparent 38%), " +
                        "radial-gradient(circle at 80% 85%, rgba(213,168,78,0.16) 0%, transparent 32%)",
                }}
            />

            <div
                className="relative z-10 w-full max-w-sm flex flex-col items-center"
                style={{ animation: "fadeInUp 0.42s ease forwards" }}
            >
                {/* Icon */}
                <div
                    style={{
                        width: "5.5rem",
                        height: "5.5rem",
                        borderRadius: "2rem",
                        background: "linear-gradient(145deg, #172B2F 0%, #3F6F6A 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 20px 50px rgba(63,111,106,0.28)",
                        fontSize: "2.4rem",
                        marginBottom: "1.5rem",
                    }}
                >
                    📢
                </div>

                {/* Label */}
                <p className="app-section-label" style={{ color: "#3F6F6A", marginBottom: "0.5rem" }}>
                    Required Step
                </p>

                {/* Title */}
                <h1
                    className="app-title"
                    style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        color: "#172B2F",
                        lineHeight: 1.2,
                        marginBottom: "1rem",
                    }}
                >
                    Join Our Official Channel
                </h1>

                {/* Description */}
                <p
                    style={{
                        fontSize: "0.92rem",
                        lineHeight: 1.6,
                        color: "#526B70",
                        maxWidth: "22rem",
                        marginBottom: "2rem",
                    }}
                >
                    To access the <strong style={{ color: "#172B2F" }}>UniPortal</strong>, you must be a member
                    of our official Telegram channel. It's where we share updates, announcements, and resources.
                </p>

                {/* Card */}
                <div
                    className="app-panel w-full"
                    style={{ padding: "1.5rem", marginBottom: "1rem" }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.85rem",
                            marginBottom: "1.25rem",
                        }}
                    >
                        <div
                            style={{
                                width: "3rem",
                                height: "3rem",
                                borderRadius: "14px",
                                background: "linear-gradient(135deg, #229ED9 0%, #1a7db5 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.3rem",
                                flexShrink: 0,
                            }}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.01 9.471c-.148.658-.537.818-1.09.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.31 14.006l-2.946-.918c-.64-.2-.652-.64.136-.948l11.498-4.433c.533-.194 1-.12.564.54z" />
                            </svg>
                        </div>
                        <div style={{ textAlign: "left" }}>
                            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#172B2F", marginBottom: "0.15rem" }}>
                                @unityuniversityportal
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "#70868B" }}>Official Telegram Channel</p>
                        </div>
                    </div>

                    {/* Primary CTA */}
                    <button
                        id="channel-gate-join-btn"
                        onClick={onJoinChannel}
                        style={{
                            width: "100%",
                            padding: "0.875rem 1.25rem",
                            borderRadius: "18px",
                            background: "linear-gradient(135deg, #229ED9 0%, #1a7db5 100%)",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.92rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            boxShadow: "0 8px 22px rgba(34,158,217,0.32)",
                            transition: "transform 140ms ease, box-shadow 140ms ease",
                            marginBottom: "0.65rem",
                        }}
                        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                        onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                        <span style={{ fontSize: "1.1rem" }}>📢</span>
                        Join Channel
                    </button>

                    {/* Divider */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            margin: "0.75rem 0",
                        }}
                    >
                        <div className="app-divider" style={{ flex: 1 }} />
                        <span style={{ fontSize: "0.72rem", color: "#70868B", fontWeight: 600 }}>THEN</span>
                        <div className="app-divider" style={{ flex: 1 }} />
                    </div>

                    {/* Secondary CTA */}
                    <button
                        id="channel-gate-check-btn"
                        onClick={onCheckJoined}
                        disabled={isChecking}
                        style={{
                            width: "100%",
                            padding: "0.875rem 1.25rem",
                            borderRadius: "18px",
                            background: isChecking
                                ? "rgba(23,43,47,0.06)"
                                : "linear-gradient(135deg, rgba(63,111,106,0.12) 0%, rgba(63,111,106,0.06) 100%)",
                            border: "1.5px solid rgba(63,111,106,0.22)",
                            color: isChecking ? "#70868B" : "#172B2F",
                            fontWeight: 700,
                            fontSize: "0.92rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            transition: "transform 140ms ease, opacity 140ms ease",
                            opacity: isChecking ? 0.7 : 1,
                        }}
                        onMouseDown={(e) => !isChecking && (e.currentTarget.style.transform = "scale(0.97)")}
                        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onTouchStart={(e) => !isChecking && (e.currentTarget.style.transform = "scale(0.97)")}
                        onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                        {isChecking ? (
                            <>
                                <span
                                    style={{
                                        width: "1rem",
                                        height: "1rem",
                                        border: "2px solid rgba(63,111,106,0.28)",
                                        borderTopColor: "#3F6F6A",
                                        borderRadius: "50%",
                                        display: "inline-block",
                                        animation: "spin 0.9s linear infinite",
                                    }}
                                />
                                Checking…
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: "1.05rem" }}>✅</span>
                                I've Joined — Continue
                            </>
                        )}
                    </button>
                </div>

                {/* Toast notification */}
                <div
                    style={{
                        width: "100%",
                        borderRadius: "16px",
                        padding: "0.8rem 1rem",
                        background: "linear-gradient(135deg, rgba(216,114,102,0.14) 0%, rgba(216,114,102,0.08) 100%)",
                        border: "1px solid rgba(216,114,102,0.28)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        transition: "opacity 0.3s ease, transform 0.3s ease",
                        opacity: toast === "not-joined" ? 1 : 0,
                        transform: toast === "not-joined" ? "translateY(0)" : "translateY(6px)",
                        pointerEvents: "none",
                    }}
                    aria-live="polite"
                    role="status"
                >
                    <span style={{ fontSize: "1rem", flexShrink: 0 }}>⚠️</span>
                    <p style={{ fontSize: "0.82rem", color: "#C86056", fontWeight: 600, textAlign: "left", margin: 0 }}>
                        You haven't joined yet. Please join the channel first.
                    </p>
                </div>
            </div>
        </div>
    );
}
