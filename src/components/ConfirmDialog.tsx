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

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Leave",
    cancelLabel = "Stay",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(10,22,40,0.46)] p-4 sm:items-center">
            <div className="w-full max-w-md rounded-[28px] border border-[rgba(31,53,91,0.08)] bg-[rgba(248,250,253,0.98)] p-5 shadow-[0_24px_60px_rgba(10,22,40,0.22)] backdrop-blur-xl">
                <p className="app-section-label">Confirm action</p>
                <h2 className="mt-2 text-xl font-bold text-[#18253D]">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#53627D]">
                    {description}
                </p>

                <div className="mt-5 space-y-3">
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        style={{
                            backgroundColor: "#18253D",
                            color: "#FFFFFF",
                            borderColor: "#18253D",
                        }}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                    <Button variant="ghost" size="md" fullWidth onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
