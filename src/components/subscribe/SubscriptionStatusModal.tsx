import { CheckCircle2, Clock3, X, XCircle } from "lucide-react";
import { useId, useRef } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import type { PaymentInstructions } from "../../api/quiz";
import Button from "../ui/Button";
import { getPaymentInstructionSummary } from "../../utils/subscription";

interface SubscriptionStatusModalProps {
    open: boolean;
    requesting: boolean;
    instructions: PaymentInstructions | null;
    onClose: () => void;
}

export default function SubscriptionStatusModal(props: SubscriptionStatusModalProps) {
    if (!props.open) return null;
    return <SubscriptionStatusPanel {...props} />;
}

function SubscriptionStatusPanel({ requesting, instructions, onClose }: SubscriptionStatusModalProps) {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    // No Escape while a payment request is being submitted (the close buttons are disabled too).
    useDialogFocus(panelRef, { onClose: requesting ? undefined : onClose });

    const status = requesting ? "submitting" : instructions?.status ?? "pending";
    const config = getSubscriptionStatusConfig(status);
    const Icon = config.icon;
    const summary = instructions ? getPaymentInstructionSummary(instructions) : "";
    const hasInstructionDetails = Boolean(instructions?.reference || summary);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(10,22,40,0.46)] px-5 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] pt-8">
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-busy={requesting}
                className="relative w-full max-w-[20rem] rounded-[24px] border border-[rgba(23,43,47,0.08)] bg-[rgba(248,250,253,0.98)] p-4 shadow-[0_18px_44px_rgba(10,22,40,0.20)] backdrop-blur-xl">
                <button
                    type="button"
                    aria-label="Close"
                    disabled={requesting}
                    onClick={onClose}
                    className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-mist text-subtle"
                    style={{ backgroundColor: "#F4F8F5", color: "#526B70" }}
                >
                    <X size={16} />
                </button>
                <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: config.iconBg, color: config.iconColor }}
                >
                    <Icon size={22} className={requesting ? "animate-spin" : ""} />
                </div>
                <p className="app-section-label mt-4 text-center">{config.label}</p>
                <h2 id={titleId} className="mt-2 text-center text-lg font-bold text-ink">{config.title}</h2>
                <p className="mt-2 text-center text-xs font-medium leading-relaxed text-subtle">
                    {config.description}
                </p>
                {hasInstructionDetails && !requesting && instructions && (
                    <div className="mt-4 rounded-[18px] border border-accent-line bg-accent-soft px-3.5 py-3">
                        {instructions.reference && (
                            <>
                                <p className="app-section-label">Reference</p>
                                <p className="mt-1 break-words text-sm font-bold text-ink">{instructions.reference}</p>
                            </>
                        )}
                        {summary && (
                            <p className="mt-1 text-xs font-semibold text-ink-soft">{summary}</p>
                        )}
                    </div>
                )}
                <div className="mt-4 grid gap-2">
                    <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        disabled={requesting}
                        onClick={onClose}
                    >
                        {requesting ? "Submitting..." : "Done"}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        disabled={requesting}
                        onClick={onClose}
                        style={{
                            backgroundColor: "#F4F8F5",
                            borderColor: "rgba(23,43,47,0.08)",
                            color: "#172B2F",
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}

function getSubscriptionStatusConfig(status: PaymentInstructions["status"] | "submitting") {
    if (status === "approved") {
        return {
            label: "Payment confirmed",
            title: "Your subscription is active",
            description: "Your payment has been confirmed. Premium study resources are now available on your account.",
            icon: CheckCircle2,
            iconBg: "#EAF8F1",
            iconColor: "#2E9E73",
        };
    }

    if (status === "rejected") {
        return {
            label: "Payment not confirmed",
            title: "We could not confirm this payment",
            description: "Please check your payment reference and submit the correct receipt or transaction reference again.",
            icon: XCircle,
            iconBg: "#FFF0ED",
            iconColor: "#D95A50",
        };
    }

    if (status === "submitting") {
        return {
            label: "Requesting subscription",
            title: "Sending your request",
            description: "Please wait while we submit your payment reference for review. We will notify you by the bot after it is checked.",
            icon: Clock3,
            iconBg: "#EAF4F1",
            iconColor: "#3F6F6A",
        };
    }

    return {
        label: "Payment processing",
        title: "Your request is under review",
        description: "Your payment request is under review. Please be patient; we will notify you by the bot once your payment is confirmed.",
        icon: Clock3,
        iconBg: "#EAF4F1",
        iconColor: "#3F6F6A",
    };
}
