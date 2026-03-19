import { GraduationCap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/authStore";

export default function SplashScreen() {
    const { error, isLoading } = useAuthStore();
    const { initAuth } = useAuth();

    return (
        <div className="app-screen items-center justify-center px-6 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,91,255,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(241,195,100,0.18),transparent_24%)]" />

            <div className="relative z-10 w-full max-w-sm app-panel rounded-[36px] px-8 py-10">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-[linear-gradient(160deg,#18253D_0%,#2D5BFF_100%)] text-white shadow-[0_20px_50px_rgba(45,91,255,0.22)]">
                    <GraduationCap size={42} />
                </div>

                <p className="app-section-label mt-6">Unity University</p>
                <h1 className="app-title mt-2 text-[2rem] font-bold text-[#18253D]">
                    Student Portal
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-[#53627D]">
                    A cleaner study hub for lecture resources, exam practice, and academic progress inside Telegram.
                </p>

                {!isLoading && error ? (
                    <div className="mt-8">
                        <p className="text-sm leading-relaxed text-[#D95A50]">{error}</p>
                        <button
                            onClick={initAuth}
                            className="mt-5 inline-flex rounded-[18px] bg-[#18253D] px-5 py-3 text-sm font-semibold text-white"
                        >
                            Try again
                        </button>
                    </div>
                ) : (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className="inline-block h-2.5 w-2.5 rounded-full bg-[#2D5BFF]"
                                style={{
                                    animation: "pulse 1.15s ease-in-out infinite",
                                    animationDelay: `${i * 0.18}s`,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
