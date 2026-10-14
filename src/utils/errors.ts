/** Reads the `message` from errors shaped by api/client.ts, falling back when there is none. */
export function getErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === "object" && "message" in error) {
        const { message } = error as { message?: unknown };
        if (typeof message === "string" && message.trim()) return message;
    }
    return fallback;
}
