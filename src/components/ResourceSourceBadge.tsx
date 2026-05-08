interface Props {
    source?: string | null;
    source_display?: string | null;
    size?: "xs" | "sm";
}

type BadgeConfig = {
    icon: string;
    label: string;
    className: string;
    tooltip: string;
};

const BADGE_CONFIG: Record<string, BadgeConfig> = {
    official: {
        icon: "🏛",
        label: "Official",
        className: "app-badge app-badge-green",
        tooltip: "Official Unity University material",
    },
    textbook: {
        icon: "📖",
        label: "Textbook",
        className: "app-badge app-badge-blue",
        tooltip: "Recommended textbook",
    },
    reference: {
        icon: "🌐",
        label: "Reference",
        className: "app-badge",
        tooltip: "Reference material",
    },
    notes: {
        icon: "📝",
        label: "Notes",
        className: "app-badge app-badge-gold",
        tooltip: "Lecture or study notes",
    },
    other: {
        icon: "📄",
        label: "Resource",
        className: "app-badge",
        tooltip: "Study resource",
    },
};

export const ResourceSourceBadge = ({ source, source_display, size = "sm" }: Props) => {
    const normalizedSource = source ?? "other";
    const normalizedDisplay = source_display ?? "Other Resource";
    const config = BADGE_CONFIG[normalizedSource] ?? BADGE_CONFIG.other;
    const sizeClass = size === "xs"
        ? "!min-h-[1.25rem] !gap-1 !px-1.5 !py-0 !text-[0.58rem]"
        : "!gap-1 !px-2 !py-0.5 !text-[0.62rem]";

    return (
        <span
            className={`${config.className} ${sizeClass}`}
            title={normalizedDisplay || config.tooltip}
            aria-label={normalizedDisplay || config.tooltip}
        >
            <span aria-hidden="true">{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
};
