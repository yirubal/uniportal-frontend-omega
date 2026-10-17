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
        listClass: "border-ok/40 bg-success-tint text-ok-ink",
        bannerClass: "border-ok bg-success-tint text-ok-ink",
        badgeClass: "bg-ok text-white",
        Icon: Check,
    },
    incorrect: {
        label: "Incorrect",
        detailLabel: "Incorrect answer",
        listClass: "border-bad/35 bg-bad-tint text-bad-ink",
        bannerClass: "border-bad bg-bad-tint text-bad-ink",
        badgeClass: "bg-bad text-white",
        Icon: X,
    },
    unanswered: {
        label: "Unanswered",
        detailLabel: "No answer submitted",
        listClass: "border-warn/40 bg-warn-tint text-warn-ink",
        bannerClass: "border-warn bg-warn-tint text-warn-ink",
        badgeClass: "bg-warn text-white",
        Icon: AlertTriangle,
    },
    not_graded: {
        label: "Not graded",
        detailLabel: "Needs manual review",
        listClass: "border-warn/40 bg-warn-tint text-warn-ink",
        bannerClass: "border-warn bg-warn-tint text-warn-ink",
        badgeClass: "bg-warn text-white",
        Icon: Minus,
    },
};
