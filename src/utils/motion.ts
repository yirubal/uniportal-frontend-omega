/** True when the phone asks for less motion; decorative animations should then be skipped. */
export function prefersReducedMotion() {
    return typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
}
