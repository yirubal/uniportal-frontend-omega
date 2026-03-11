import Button from "./Button";

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export default function ErrorState({
                                       message = "Something went wrong. Please try again.",
                                       onRetry,
                                   }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <span className="text-5xl mb-4">⚠️</span>
            <p className="text-sm text-[#555] mb-6 max-w-xs">{message}</p>
            {onRetry && (
                <Button variant="primary" size="sm" onClick={onRetry}>
                    Try Again
                </Button>
            )}
        </div>
    );
}