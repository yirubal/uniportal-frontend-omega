interface SkeletonProps {
    className?: string;
    rounded?: "sm" | "md" | "lg" | "full";
}

export default function Skeleton({
                                     className = "",
                                     rounded = "md",
                                 }: SkeletonProps) {
    const radii = {
        sm: "rounded",
        md: "rounded-xl",
        lg: "rounded-2xl",
        full: "rounded-full",
    };

    return (
        <div
            aria-hidden="true"
            className={`skeleton ${radii[rounded]} ${className}`}
        />
    );
}

/** Placeholder shaped like a list row (icon, title, meta line), so loading lists keep their layout. */
export function SkeletonRow({ lines = 2, trailing = true }: { lines?: 1 | 2 | 3; trailing?: boolean }) {
    return (
        <div className="app-list-item" aria-hidden="true">
            <Skeleton className="h-11 w-11 shrink-0" rounded="lg" />
            <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" rounded="full" />
                {lines >= 2 && <Skeleton className="h-3 w-1/2" rounded="full" />}
                {lines >= 3 && <Skeleton className="h-3 w-2/3" rounded="full" />}
            </div>
            {trailing && <Skeleton className="h-9 w-9 shrink-0" rounded="full" />}
        </div>
    );
}

/** A loading list: announces "Loading" once to screen readers and shows `count` placeholder rows. */
export function SkeletonList({ count = 3, lines = 2, trailing = true, label = "Loading" }: { count?: number; lines?: 1 | 2 | 3; trailing?: boolean; label?: string }) {
    return (
        <div role="status" aria-label={label} className="space-y-3">
            {Array.from({ length: count }, (_, index) => (
                <SkeletonRow key={index} lines={lines} trailing={trailing} />
            ))}
        </div>
    );
}
