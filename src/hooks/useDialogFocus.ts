import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogFocusOptions {
    /** Called on Escape. Omit (or pass undefined) while the dialog must not be dismissed, e.g. mid-submit. */
    onClose?: () => void;
    /** Element to focus first; defaults to the first focusable element in the dialog. */
    initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Modal keyboard behaviour for a dialog that is mounted only while open: moves focus into it, keeps Tab
 * and Shift+Tab inside it, closes on Escape, and returns focus to whatever was focused before it opened.
 */
export function useDialogFocus(containerRef: RefObject<HTMLElement | null>, { onClose, initialFocusRef }: DialogFocusOptions = {}) {
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        const focusables = () => [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        (initialFocusRef?.current ?? focusables()[0] ?? container).focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && onCloseRef.current) {
                event.preventDefault();
                onCloseRef.current();
                return;
            }
            if (event.key !== "Tab") return;

            const items = focusables();
            if (items.length === 0) {
                event.preventDefault();
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [containerRef, initialFocusRef]);
}
