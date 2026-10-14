import { useEffect, useRef, useState } from "react";

type AsyncResult<T> = { key: string | null; data: T | null; error: unknown };

/**
 * Loads data for `key` (null = nothing to load). Results are stored with the key they belong to, so a
 * change of key shows `loading` immediately without resetting state inside an effect, and responses for an
 * old key are aborted and ignored. `reload()` refetches the current key.
 */
export function useAsyncData<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>) {
    const [result, setResult] = useState<AsyncResult<T>>({ key: null, data: null, error: null });
    const [reloadCount, setReloadCount] = useState(0);
    const loadRef = useRef(load);
    useEffect(() => {
        loadRef.current = load;
    });

    const requestKey = key === null ? null : `${key}#${reloadCount}`;

    useEffect(() => {
        if (requestKey === null) return;

        const controller = new AbortController();
        loadRef.current(controller.signal).then(
            (data) => {
                if (!controller.signal.aborted) setResult({ key: requestKey, data, error: null });
            },
            (error: unknown) => {
                if (!controller.signal.aborted) setResult({ key: requestKey, data: null, error });
            }
        );

        return () => controller.abort();
    }, [requestKey]);

    const isCurrent = requestKey !== null && result.key === requestKey;

    return {
        data: isCurrent ? result.data : null,
        error: isCurrent ? result.error : null,
        loading: requestKey !== null && !isCurrent,
        reload: () => setReloadCount((count) => count + 1),
    };
}
