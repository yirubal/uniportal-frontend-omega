import { Moon, Sun, SunMoon } from "lucide-react";
import { type ThemePreference, useTheme } from "../utils/theme";
import { haptic } from "../utils/haptics";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: "system", label: "Auto", icon: SunMoon },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
];

/** Auto / Light / Dark. Auto follows Telegram's own setting. */
export default function ThemeSwitch() {
    const { preference, setPreference } = useTheme();

    return (
        <div role="radiogroup" aria-label="Appearance" className="inline-flex rounded-full border border-line bg-mist p-1">
            {OPTIONS.map(({ value, label, icon: Icon }) => {
                const selected = preference === value;
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                            if (selected) return;
                            haptic.selection();
                            setPreference(value);
                        }}
                        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors duration-200 ${
                            selected ? "bg-fill text-white shadow-[0_4px_10px_var(--shadow-tint)]" : "text-subtle"
                        }`}
                    >
                        <Icon size={14} strokeWidth={2.4} />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
