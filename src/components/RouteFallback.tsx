import { Skeleton, SkeletonList } from "./ui";

/** Shown for the moment a lazily loaded screen's code is being fetched: the outline of a typical screen. */
export function RouteFallback() {
    return (
        <div className="app-screen" aria-busy="true">
            <div className="app-topbar" aria-hidden="true">
                <Skeleton className="mb-5 h-11 w-24" rounded="lg" />
                <Skeleton className="h-3 w-28" rounded="full" />
                <Skeleton className="mt-3 h-7 w-3/4" rounded="full" />
                <Skeleton className="mt-3 h-4 w-2/3" rounded="full" />
            </div>
            <div className="app-scroll app-scroll-compact">
                <Skeleton className="mb-4 h-28 rounded-[24px]" />
                <SkeletonList count={4} />
            </div>
        </div>
    );
}
