import { useCallback, useEffect, useRef, useState } from "react";
import { getMyProfile } from "../api/auth";
import { getSubscriptionRequest, type SubscriptionRequestState } from "../api/quiz";
import { useAuthStore } from "../store/authStore";
import { useAccess } from "./useAccess";

/** Focus/visibility syncs closer together than this are skipped. */
const BACKGROUND_SYNC_THROTTLE_MS = 8000;

interface RefreshOptions {
    /** Hide the global slow-request loader (background syncs). Defaults to true. */
    silent?: boolean;
    /** Skip if the last sync was less than BACKGROUND_SYNC_THROTTLE_MS ago. */
    throttle?: boolean;
    /** Start a new request even if one is in flight (e.g. right after submitting a payment request). */
    force?: boolean;
}

/**
 * Subscription state shared by Home, Subscription and Subscribe: refreshes the profile (premium/expiry)
 * and the latest payment request together, de-duplicates overlapping refreshes, and optionally re-syncs
 * when the student returns to the app (e.g. after paying in Telebirr).
 */
export function useSubscriptionStatus({ syncOnFocus = false }: { syncOnFocus?: boolean } = {}) {
    const { isPremium: hasActivePremium, daysRemaining } = useAccess();
    const [requestState, setRequestState] = useState<SubscriptionRequestState | null>(null);
    const inFlightRef = useRef<Promise<SubscriptionRequestState | null> | null>(null);
    const lastSyncAtRef = useRef(0);
    const latestRequestIdRef = useRef(0);

    const refresh = useCallback((options: RefreshOptions = {}): Promise<SubscriptionRequestState | null> => {
        if (inFlightRef.current && !options.force) return inFlightRef.current;
        const now = Date.now();
        if (options.throttle && now - lastSyncAtRef.current < BACKGROUND_SYNC_THROTTLE_MS) {
            return Promise.resolve(null);
        }
        lastSyncAtRef.current = now;
        const requestId = ++latestRequestIdRef.current;

        const skipGlobalLoader = options.silent ?? true;
        const request = Promise.allSettled([
            getMyProfile({ skipGlobalLoader }),
            // Optional data: a failure here must not log the student out.
            getSubscriptionRequest({ skipGlobalLoader, skipAuthClear: true }),
        ])
            .then(([profileResult, requestResult]) => {
                // A forced refresh may overtake an older one; only the latest result is applied.
                if (requestId !== latestRequestIdRef.current) {
                    return requestResult.status === "fulfilled" ? requestResult.value : null;
                }
                const { token, setAuth } = useAuthStore.getState();
                if (profileResult.status === "fulfilled" && token) {
                    setAuth(token, profileResult.value);
                }
                if (requestResult.status === "fulfilled") {
                    setRequestState(requestResult.value);
                    return requestResult.value;
                }
                return null;
            })
            .finally(() => {
                if (inFlightRef.current === request) inFlightRef.current = null;
            });

        inFlightRef.current = request;
        return request;
    }, []);

    useEffect(() => {
        if (!syncOnFocus) return;

        const sync = () => void refresh({ throttle: true });
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") sync();
        };

        window.addEventListener("focus", sync);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            window.removeEventListener("focus", sync);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [refresh, syncOnFocus]);

    const requestStatus = requestState?.current_request?.status;
    const hasPendingRequest = requestState?.has_pending_request === true || requestStatus === "pending";
    // Product decision (2026-10-14): while a payment request is pending or was rejected, the plan is shown
    // as Free even if an earlier subscription is still active. Access checks use useAccess, not this flag.
    const isPremium = hasPendingRequest || requestStatus === "rejected" ? false : hasActivePremium;

    return {
        requestState,
        refresh,
        /** Premium as displayed in the UI (see the product rule above). */
        isPremium,
        daysRemaining,
        requestStatus,
        hasPendingRequest,
        currentRequest: requestState?.current_request ?? null,
    };
}
