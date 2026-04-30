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
        <div className="app-state py-12">
            <span className="app-state-icon mb-4 bg-[#FFF0ED] text-3xl text-[#D95A50]">!</span>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#526B70]">{message}</p>
            {onRetry && (
                <Button variant="primary" size="sm" onClick={onRetry}>
                    Try Again
                </Button>
            )}
        </div>
    );
}
