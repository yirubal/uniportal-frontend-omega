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
        <div className="app-panel flex flex-col items-center justify-center rounded-[28px] px-6 py-14 text-center">
            <span className="mb-4 text-5xl">⚠️</span>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#53627D]">{message}</p>
            {onRetry && (
                <Button variant="primary" size="sm" onClick={onRetry}>
                    Try Again
                </Button>
            )}
        </div>
    );
}
