import Button from "./Button";

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export default function EmptyState({
                                       icon = "📭",
                                       title,
                                       description,
                                       action,
                                   }: EmptyStateProps) {
    return (
        <div className="app-panel flex flex-col items-center justify-center rounded-[28px] px-6 py-14 text-center">
            <span className="mb-4 text-5xl">{icon}</span>
            <p className="text-base font-semibold text-[#18253D] mb-2">{title}</p>
            {description && (
                <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#53627D]">{description}</p>
            )}
            {action && (
                <Button variant="primary" size="sm" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}
