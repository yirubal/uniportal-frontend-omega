import { Skeleton } from "./ui";

/** Shown for the moment a lazily loaded screen's code is being fetched. */
export function RouteFallback() {
    return (
        <div className="app-screen px-5 pt-12" aria-busy="true">
            <Skeleton className="mb-4 h-24 rounded-[28px]" />
            <Skeleton className="mb-4 h-40 rounded-[28px]" />
            <Skeleton className="h-40 rounded-[28px]" />
        </div>
    );
}
