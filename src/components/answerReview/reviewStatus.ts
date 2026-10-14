import { AlertTriangle, Check, Minus, X } from "lucide-react";
import type { ReviewStatus } from "../../utils/answerReview";

export const STATUS_META: Record<ReviewStatus, {
    label: string;
    detailLabel: string;
    listClass: string;
    bannerClass: string;
    badgeClass: string;
    Icon: typeof Check;
}> = {
    correct: {
        label: "Correct",
        detailLabel: "Correct answer",
        listClass: "border-[#10B981]/40 bg-[#ECFDF5] text-[#065F46]",
        bannerClass: "border-[#10B981] bg-[#ECFDF5] text-[#065F46]",
        badgeClass: "bg-[#10B981] text-white",
        Icon: Check,
    },
    incorrect: {
        label: "Incorrect",
        detailLabel: "Incorrect answer",
        listClass: "border-[#EF4444]/35 bg-[#FEF2F2] text-[#991B1B]",
        bannerClass: "border-[#EF4444] bg-[#FEF2F2] text-[#991B1B]",
        badgeClass: "bg-[#EF4444] text-white",
        Icon: X,
    },
    unanswered: {
        label: "Unanswered",
        detailLabel: "No answer submitted",
        listClass: "border-[#F59E0B]/40 bg-[#FFFBEB] text-[#92400E]",
        bannerClass: "border-[#F59E0B] bg-[#FFFBEB] text-[#92400E]",
        badgeClass: "bg-[#F59E0B] text-white",
        Icon: AlertTriangle,
    },
    not_graded: {
        label: "Not graded",
        detailLabel: "Needs manual review",
        listClass: "border-[#F59E0B]/40 bg-[#FFFBEB] text-[#92400E]",
        bannerClass: "border-[#F59E0B] bg-[#FFFBEB] text-[#92400E]",
        badgeClass: "bg-[#F59E0B] text-white",
        Icon: Minus,
    },
};
