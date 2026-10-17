import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { initAuth } from "../hooks/useAuth";

type ToastState = "idle" | "checking" | "not-joined";

const DEFAULT_CHANNEL_URL = "https://t.me/unityuniversityportal";

/** "@name" from a t.me link, so the card shows the channel the backend actually asked for. */
function getChannelHandle(url: string) {
    const name = url.replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i, "").split(/[/?#]/)[0];
    return name ? `@${name}` : url;
}

export default function ChannelGateScreen() {
    const channelUrl = useAuthStore((state) => state.channelUrl);
    const [toast, setToast] = useState<ToastState>("idle");

    function onJoinChannel() {
        const tg = (window as Window & { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } }).Telegram?.WebApp;
        const url = channelUrl ?? DEFAULT_CHANNEL_URL;
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
        // Silent: a global loading state would swap this screen for Splash and the toast below would never show.
        await initAuth({ silent: true });
        // If still channelRequired after auth, they haven't joined
        const stillRequired = useAuthStore.getState().channelRequired;
        if (stillRequired && prevChannelRequired) {
            setToast("not-joined");
            setTimeout(() => setToast("idle"), 3500);
        }
    }

    const isChecking = toast === "checking";
    const showNotJoined = toast === "not-joined";

    return (
        <div className="app-screen items-center justify-center px-5 text-center" style={{ animation: "fadeIn 0.35s ease forwards" }}>
            {/* Ambient gradients */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(circle at 20% 10%, rgba(63,111,106,0.18) 0%, transparent 38%), " +
                        "radial-gradient(circle at 80% 85%, rgba(213,168,78,0.16) 0%, transparent 32%)",
                }}
            />

            <div className="relative z-10 flex w-full max-w-sm flex-col items-center" style={{ animation: "fadeInUp 0.42s ease forwards" }}>
                <div
                    aria-hidden="true"
                    className="mb-6 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-[2rem] bg-[linear-gradient(145deg,#172B2F_0%,#3F6F6A_100%)] text-[2.4rem] shadow-[0_20px_50px_rgba(63,111,106,0.28)]"
                >
                    📢
                </div>

                <p className="app-section-label mb-2 !text-accent">Required Step</p>

                <h1 className="app-title mb-4 text-[1.75rem] font-extrabold leading-[1.2] text-ink">
                    Join Our Official Channel
                </h1>

                <p className="mb-8 max-w-[22rem] text-[0.92rem] leading-[1.6] text-subtle">
                    To access the <strong className="text-ink">UniPortal</strong>, you must be a member
                    of our official Telegram channel. It's where we share updates, announcements, and resources.
                </p>

                <div className="app-panel mb-4 w-full p-6">
                    <div className="mb-5 flex items-center gap-[0.85rem]">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#229ED9_0%,#1a7db5_100%)] text-[1.3rem]">
                            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="white">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.01 9.471c-.148.658-.537.818-1.09.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.31 14.006l-2.946-.918c-.64-.2-.652-.64.136-.948l11.498-4.433c.533-.194 1-.12.564.54z" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <p className="mb-[0.15rem] text-[0.85rem] font-bold text-ink">
                                {getChannelHandle(channelUrl ?? DEFAULT_CHANNEL_URL)}
                            </p>
                            <p className="text-[0.75rem] text-faint">Official Telegram Channel</p>
                        </div>
                    </div>

                    <button
                        id="channel-gate-join-btn"
                        type="button"
                        onClick={onJoinChannel}
                        className="mb-[0.65rem] flex w-full items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#229ED9_0%,#1a7db5_100%)] px-5 py-3.5 text-[0.92rem] font-bold text-white shadow-[0_8px_22px_rgba(34,158,217,0.32)] transition-transform duration-150 active:scale-[0.97]"
                    >
                        <span aria-hidden="true" className="text-[1.1rem]">📢</span>
                        Join Channel
                    </button>

                    <div className="my-3 flex items-center gap-3">
                        <div className="app-divider flex-1" />
                        <span className="text-[0.72rem] font-semibold text-faint">THEN</span>
                        <div className="app-divider flex-1" />
                    </div>

                    <button
                        id="channel-gate-check-btn"
                        type="button"
                        onClick={onCheckJoined}
                        disabled={isChecking}
                        className={`flex w-full items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-accent/25 px-5 py-3.5 text-[0.92rem] font-bold transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:active:scale-100 ${
                            isChecking
                                ? "bg-line text-faint opacity-70"
                                : "bg-[linear-gradient(135deg,rgba(63,111,106,0.12)_0%,rgba(63,111,106,0.06)_100%)] text-ink"
                        }`}
                    >
                        {isChecking ? (
                            <>
                                <span aria-hidden="true" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                                Checking…
                            </>
                        ) : (
                            <>
                                <span aria-hidden="true" className="text-[1.05rem]">✅</span>
                                I've Joined — Continue
                            </>
                        )}
                    </button>
                </div>

                {/* The live region stays mounted; its text appears only with the toast so it is announced
                    then, instead of a hidden message being read on load. */}
                <div
                    role="status"
                    aria-live="polite"
                    className={`pointer-events-none flex w-full items-center gap-[0.6rem] rounded-2xl border border-bad-line bg-[linear-gradient(135deg,rgba(216,114,102,0.14)_0%,rgba(216,114,102,0.08)_100%)] px-4 py-[0.8rem] transition-[opacity,transform] duration-300 ${
                        showNotJoined ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
                    }`}
                >
                    <span aria-hidden="true" className="shrink-0 text-base">⚠️</span>
                    <p className="m-0 text-left text-[0.82rem] font-semibold text-bad-ink">
                        {showNotJoined ? "You haven't joined yet. Please join the channel first." : "\u00a0"}
                    </p>
                </div>
            </div>
        </div>
    );
}
