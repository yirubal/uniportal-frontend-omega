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
        <div className="app-state py-12">
            <span className="app-state-icon mb-4 text-3xl">{icon}</span>
            <p className="mb-2 text-base font-semibold text-[#172B2F]">{title}</p>
            {description && (
                <p className="app-copy mb-6 max-w-xs">{description}</p>
            )}
            {action && (
                <Button variant="primary" size="sm" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}
