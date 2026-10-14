import { isNetworkError } from "./client";

type DevMocks = typeof import("./devMocks");

/** Per-request options shared by the API helpers. */
export interface ApiRequestOptions {
    skipGlobalLoader?: boolean;
    skipAuthClear?: boolean;
    signal?: AbortSignal;
}

/** True only in `npm run dev` with VITE_FORCE_DEV_MOCKS=true. Always false in production builds. */
export const forceDevMocks = import.meta.env.DEV && import.meta.env.VITE_FORCE_DEV_MOCKS === "true";

/**
 * Runs a real API request, with dev-only mock data:
 * - VITE_FORCE_DEV_MOCKS=true: always returns the mock, without calling the backend.
 * - Otherwise in dev: falls back to the mock only when the backend is unreachable (no HTTP response).
 *   HTTP errors (401, 403/upgrade_required, 404, 500...) always reach the caller so they are not masked.
 * - Production: never touches mocks; the dynamic import is dropped from the bundle.
 */
export async function withDevFallback<T>(
    label: string,
    request: () => Promise<T>,
    mock: (mocks: DevMocks) => T | Promise<T>
): Promise<T> {
    if (import.meta.env.DEV && forceDevMocks) {
        console.info(`[dev] Force using mock ${label}`);
        return mock(await import("./devMocks"));
    }

    try {
        return await request();
    } catch (error) {
        if (import.meta.env.DEV && isNetworkError(error)) {
            console.info(`[dev] Backend unreachable, using mock ${label}`);
            return mock(await import("./devMocks"));
        }
        throw error;
    }
}
