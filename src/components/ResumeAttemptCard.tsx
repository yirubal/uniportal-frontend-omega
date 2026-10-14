import { PlayCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getResumeRoute, type QuizMode, useQuizStore } from "../store/quizStore";
import { formatTimeRemaining, getSecondsUntil } from "../utils/format";
import { isQuestionAnswered } from "../utils/questions";
import ConfirmDialog from "./ConfirmDialog";
import Button from "./ui/Button";

/**
 * Offers to reopen an unfinished attempt saved in the quiz store (after a reload or reopening the Mini App).
 * `modes` limits which attempts a screen shows, e.g. only simulations on the exit exam hub.
 */
export default function ResumeAttemptCard({ modes }: { modes?: QuizMode[] }) {
    const navigate = useNavigate();
    const studentId = useAuthStore((state) => state.student?.telegram_id);
    const resumeRoute = useQuizStore((state) => getResumeRoute(state, studentId));
    const mode = useQuizStore((state) => state.mode);
    const questions = useQuizStore((state) => state.questions);
    const answers = useQuizStore((state) => state.answers);
    const deadline = useQuizStore((state) => state.deadline);
    const title = useQuizStore((state) => state.selectedQuizTitle ?? state.courseName);
    const resetAttempt = useQuizStore((state) => state.resetAttempt);
    const [confirmDiscard, setConfirmDiscard] = useState(false);

    if (!resumeRoute || (modes && !modes.includes(mode))) return null;

    const answeredCount = questions.filter((question) => isQuestionAnswered(question, answers)).length;
    const secondsLeft = deadline === null ? null : getSecondsUntil(deadline);
    const isExam = mode === "simulation";
    const kindLabel = isExam ? "Exit exam" : mode === "selective" ? "Selective practice" : "Practice";

    return (
        <div className="app-sheet mb-4 p-4">
            <div className="flex items-start gap-3">
                <div className="app-icon-chip bg-[#EAF4F1] text-[#3F6F6A]">
                    <PlayCircle size={18} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="app-section-label">Unfinished {kindLabel.toLowerCase()}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-[#172B2F]">{title ?? kindLabel}</p>
                    <p className="mt-1 text-xs text-[#526B70]">
                        {answeredCount}/{questions.length} answered
                        {secondsLeft !== null && (secondsLeft > 0
                            ? ` · ${formatTimeRemaining(secondsLeft)} left`
                            : " · Time is up, submit your answers")}
                    </p>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="secondary" size="md" fullWidth onClick={() => setConfirmDiscard(true)}>
                    Discard
                </Button>
                <Button variant="primary" size="md" fullWidth onClick={() => navigate(resumeRoute)}>
                    Resume
                </Button>
            </div>

            <ConfirmDialog
                open={confirmDiscard}
                title={`Discard this ${kindLabel.toLowerCase()}?`}
                description="Your saved answers will be deleted and this attempt will not be submitted."
                confirmLabel="Discard"
                cancelLabel="Keep it"
                onConfirm={() => {
                    setConfirmDiscard(false);
                    resetAttempt();
                }}
                onCancel={() => setConfirmDiscard(false)}
            />
        </div>
    );
}
