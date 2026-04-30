import { Wifi } from "lucide-react";
import { useNetworkStore } from "../store/networkStore";

export default function SlowRequestLoader() {
    const visible = useNetworkStore((state) => state.showSlowLoader);

    if (!visible) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.9rem)] z-[70] flex justify-center px-4 animate-fade-in-down">
            <div
                role="status"
                aria-live="polite"
                className="app-panel flex w-full max-w-xs items-center gap-3 rounded-full px-4 py-3 shadow-[0_18px_40px_rgba(23,43,47,0.16)]"
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF4F1] text-[#3F6F6A]">
                    <Wifi size={18} />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#172B2F]">Syncing with server</p>
                    <div className="mt-1 flex items-center gap-1.5">
                        {[0, 1, 2].map((index) => (
                            <span
                                key={index}
                                className="inline-block h-2 w-2 rounded-full bg-[#3F6F6A]"
                                style={{
                                    animation: "pulse 1.05s ease-in-out infinite",
                                    animationDelay: `${index * 0.16}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
