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
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <span className="text-5xl mb-4">{icon}</span>
            <p className="text-base font-semibold text-[#1A1A1A] mb-2">{title}</p>
            {description && (
                <p className="text-sm text-[#999] mb-6 max-w-xs">{description}</p>
            )}
            {action && (
                <Button variant="primary" size="sm" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}