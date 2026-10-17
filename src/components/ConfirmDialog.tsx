import { useId, useRef } from "react";
import { useDialogFocus } from "../hooks/useDialogFocus";
import Button from "./ui/Button";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog(props: ConfirmDialogProps) {
    if (!props.open) return null;
    return <ConfirmDialogPanel {...props} />;
}

function ConfirmDialogPanel({
    title,
    description,
    confirmLabel = "Leave",
    cancelLabel = "Stay",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const titleId = useId();
    const descriptionId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    // Focus starts on the safe choice, and Escape means "cancel".
    useDialogFocus(panelRef, { onClose: onCancel, initialFocusRef: cancelRef });

    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(10,22,40,0.46)] p-4 sm:items-center">
            <div
                ref={panelRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="w-full max-w-md rounded-[28px] border border-line bg-card p-5 shadow-[0_24px_60px_rgba(10,22,40,0.22)] backdrop-blur-xl"
            >
                <p className="app-section-label">Confirm action</p>
                <h2 id={titleId} className="mt-2 text-xl font-bold text-ink">{title}</h2>
                <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-subtle">
                    {description}
                </p>

                <div className="mt-5 space-y-3">
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                    <Button ref={cancelRef} variant="ghost" size="md" fullWidth onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
