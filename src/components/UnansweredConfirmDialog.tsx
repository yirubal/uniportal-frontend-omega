import ConfirmDialog from "./ConfirmDialog";

/** "Submit now?" confirmation shown when "Finish now" is tapped with questions still unanswered. */
export default function UnansweredConfirmDialog({
    open,
    unansweredCount,
    timed = false,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    unansweredCount: number;
    /** Exit exams mention the time left on the clock. */
    timed?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const questions = `${unansweredCount} unanswered ${unansweredCount === 1 ? "question" : "questions"}`;

    return (
        <ConfirmDialog
            open={open}
            title={timed ? "Submit the exam now?" : "Submit now?"}
            description={
                timed
                    ? `You have ${questions} and time left on the clock. Unanswered questions earn no points.`
                    : `You have ${questions}. Unanswered questions earn no points.`
            }
            confirmLabel={timed ? "Submit exam" : "Submit"}
            cancelLabel="Keep going"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
}
