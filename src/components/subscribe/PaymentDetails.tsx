import type { PaymentInstructions, PaymentOptions } from "../../api/quiz";
import { getPaymentInstructionSummary } from "../../utils/subscription";

function PaymentOption({
    label,
    accountLabel,
    accountValue,
    holderName,
}: {
    label: string;
    accountLabel: string;
    accountValue: string;
    holderName?: string;
}) {
    return (
        <div className="rounded-[20px] border border-[rgba(23,43,47,0.10)] bg-white/85 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#526B70]">{label}</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#70868B]">{accountLabel}</p>
            <p className="mt-1 break-words text-sm font-bold text-[#172B2F]">{accountValue}</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#70868B]">Account holder</p>
            <p className="mt-1 break-words text-xs font-semibold text-[#354F55]">
                {holderName ?? "Account holder name not loaded"}
            </p>
        </div>
    );
}

export function PaymentDestinationCard({
    paymentMethod,
    paymentOptions,
}: {
    paymentMethod: "telebirr" | "cbe";
    paymentOptions: PaymentOptions;
}) {
    const destination =
        paymentMethod === "telebirr"
            ? {
                label: "Send Telebirr to",
                primary: paymentOptions.telebirr?.number ?? "Telebirr number not loaded",
                holderName: paymentOptions.telebirr?.name,
            }
            : {
                label: "Send CBE transfer to",
                primary: paymentOptions.cbe?.account ?? "CBE is not available right now",
                holderName: paymentOptions.cbe?.name,
            };

    return (
        <div className="mt-4 rounded-[22px] border border-[#CFE2DE] bg-[#EAF4F1] p-4">
            <p className="app-section-label">{destination.label}</p>
            <p className="mt-2 break-words text-lg font-black leading-tight text-[#172B2F]">
                {destination.primary}
            </p>
            <div className="mt-3 rounded-[16px] bg-white/65 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#70868B]">Account holder</p>
                <p className="mt-1 break-words text-sm font-semibold leading-relaxed text-[#354F55]">
                    {destination.holderName ?? "Account holder name not loaded"}
                </p>
            </div>
        </div>
    );
}

export function SubscriptionInstructionsCard({ instructions }: { instructions: PaymentInstructions }) {
    const paymentOptions = instructions.payment_options ?? {};
    const summary = getPaymentInstructionSummary(instructions);
    const hasReferenceDetails = Boolean(instructions.reference || summary || instructions.note);
    const hasPaymentOptions = Boolean(paymentOptions.telebirr || paymentOptions.cbe);
    const fallbackMessage =
        instructions.status === "pending"
            ? "Your payment request is under review. Please be patient; we will notify you by the bot once your payment is confirmed."
            : "";

    return (
        <div className="app-sheet p-5">
            <p className="app-section-label">
                {instructions.status === "pending" ? "Pending request" : "Payment instructions"}
            </p>
            {(instructions.instructions || fallbackMessage) && (
                <p className="mt-3 text-sm font-semibold leading-relaxed text-[#172B2F]">
                    {instructions.instructions ?? fallbackMessage}
                </p>
            )}
            {hasReferenceDetails && (
                <div className="mt-4 rounded-[22px] border border-[#CFE2DE] bg-[#EAF4F1] p-4">
                    {instructions.reference && (
                        <>
                            <p className="app-section-label">Reference</p>
                            <p className="mt-2 break-words text-lg font-bold text-[#172B2F]">{instructions.reference}</p>
                        </>
                    )}
                    {summary && (
                        <p className="mt-1 text-sm font-semibold text-[#172B2F]">
                            {summary}
                        </p>
                    )}
                    {instructions.note && (
                        <p className="mt-3 text-sm leading-relaxed text-[#526B70]">{instructions.note}</p>
                    )}
                </div>
            )}

            {hasPaymentOptions && (
                <div className="mt-4 grid gap-3">
                    {paymentOptions.telebirr && (
                        <PaymentOption
                            label="Telebirr"
                            accountLabel="Number"
                            accountValue={paymentOptions.telebirr.number}
                            holderName={paymentOptions.telebirr.name}
                        />
                    )}
                    {paymentOptions.cbe && (
                        <PaymentOption
                            label="CBE"
                            accountLabel="Account number"
                            accountValue={paymentOptions.cbe.account}
                            holderName={paymentOptions.cbe.name}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
