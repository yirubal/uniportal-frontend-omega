import { BookOpenCheck, ClipboardList, FileText, Lock, TimerReset } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCoursePracticePapers, type ExamPaper } from "../api/quiz";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { formatDuration } from "../utils/format";
import { useQuizStore } from "../store/quizStore";
import { getPracticeContentMeta } from "../utils/practice";
import { useAccess } from "../hooks/useAccess";
import { useAsyncData } from "../hooks/useAsyncData";

const NO_PAPERS: ExamPaper[] = [];

export default function QuizListScreen() {
    const navigate = useNavigate();
    const { practiceContentType, courseId, courseName, selectedQuizId, setSelectedQuiz, resetAttempt } = useQuizStore(
        useShallow((state) => ({
            practiceContentType: state.practiceContentType,
            courseId: state.courseId,
            courseName: state.courseName,
            selectedQuizId: state.selectedQuizId,
            setSelectedQuiz: state.setSelectedQuiz,
            resetAttempt: state.resetAttempt,
        }))
    );
    const { isPremium } = useAccess();

    const meta = getPracticeContentMeta(practiceContentType);
    const papers = useAsyncData(
        courseId && practiceContentType ? `${courseId}|${practiceContentType}` : null,
        (signal) => getCoursePracticePapers(courseId!, practiceContentType!, { signal })
    );
    const quizzes = papers.data ?? NO_PAPERS;
    const loading = papers.loading;
    const error = papers.error ? `Failed to load ${meta.listLabel.toLowerCase()} for this course.` : null;

    useEffect(() => {
        // Drop any previous attempt but keep the last opened paper so the list can highlight it.
        const { selectedQuizId: lastQuizId, selectedQuizTitle: lastQuizTitle } = useQuizStore.getState();
        resetAttempt();
        if (lastQuizId && lastQuizTitle) setSelectedQuiz(lastQuizId, lastQuizTitle);
    }, [resetAttempt, setSelectedQuiz]);

    if (!practiceContentType) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <EmptyState
                        title="Choose a practice path first"
                        description="Open the Practice Hub and choose quiz or past exam before loading a list."
                        action={{ label: "Back to hub", onClick: () => navigate("/quiz", { replace: true }) }}
                    />
                </div>
            </div>
        );
    }

    if (!courseId) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <EmptyState
                        title="Pick a course first"
                        description={`The ${meta.listLabel.toLowerCase()} view needs a course selection before it can load.`}
                        action={{ label: "Back to setup", onClick: () => navigate("/quiz/setup", { replace: true }) }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/quiz/setup")} label="Setup" />
                    <p className="app-section-label">{meta.sectionLabel}</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-ink">
                        {courseName ?? meta.listLabel}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-subtle">
                        {meta.listDescription}
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <div className="app-sheet p-4">
                    <div className="flex items-start gap-3">
                        <div className="app-icon-chip">
                            <ClipboardList size={18} />
                        </div>
                        <div>
                            <p className="app-section-label">Selected course</p>
                            <p className="mt-2 text-sm font-semibold text-ink">{courseName}</p>
                            <p className="mt-1 text-sm text-subtle">
                                {practiceContentType === "quiz"
                                    ? "Each quiz loads independently and submits as a separate attempt."
                                    : "Each past exam paper loads as its own practice attempt."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <p className="mb-3 app-section-label">{meta.listLabel}</p>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-[28px]" />)}
                        </div>
                    ) : error ? (
                        <ErrorState message={error} onRetry={papers.reload} />
                    ) : quizzes.length === 0 ? (
                        <EmptyState
                            title={meta.emptyTitle}
                            description={meta.emptyDescription}
                            action={{ label: "Choose another course", onClick: () => navigate("/quiz/setup") }}
                        />
                    ) : (
                        <div className="space-y-3">
                            {quizzes.map((quiz) => (
                                <QuizPaperButton
                                    key={quiz.id}
                                    quiz={quiz}
                                    isLocked={quiz.access_level === "premium" && !isPremium}
                                    isSelected={selectedQuizId === quiz.id}
                                    practiceContentType={practiceContentType}
                                    onOpen={() => {
                                        if (quiz.access_level === "premium" && !isPremium) {
                                            navigate("/subscribe");
                                            return;
                                        }

                                        setSelectedQuiz(quiz.id, quiz.title);
                                        navigate(`/quiz/take/${quiz.id}`);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function QuizPaperButton({
    quiz,
    isLocked,
    isSelected,
    practiceContentType,
    onOpen,
}: {
    quiz: ExamPaper;
    isLocked: boolean;
    isSelected: boolean;
    practiceContentType: "quiz" | "past_exam";
    onOpen: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className={`app-list-item ${isSelected ? "ring-2 ring-accent/20" : ""}`}
        >
            <div className={`app-icon-chip ${practiceContentType === "quiz" ? "bg-accent-soft text-accent" : "bg-gold-tint text-gold-ink"}`}>
                {practiceContentType === "quiz" ? <BookOpenCheck size={18} /> : <FileText size={18} />}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${practiceContentType === "quiz" ? "bg-accent-soft text-accent" : "bg-gold-tint text-gold-ink"}`}>
                        {practiceContentType === "quiz" ? "Quiz" : "Past exam"}
                    </span>
                    <span className="rounded-full bg-mist px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-steel">
                        {quiz.year}
                    </span>
                    {isLocked && (
                        <span className="rounded-full bg-coral-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-bad-ink">
                            Premium
                        </span>
                    )}
                </div>
                <p className="mt-3 text-sm font-semibold leading-snug text-ink">
                    {quiz.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-faint">
                    <span>{quiz.total_questions} questions</span>
                    <span>{formatDuration(quiz.duration_minutes)}</span>
                    <span>{quiz.access_level}</span>
                </div>
            </div>

            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isLocked ? "bg-coral-soft text-bad-ink" : "bg-mist text-ink"}`}>
                {isLocked ? <Lock size={18} /> : <TimerReset size={18} />}
            </div>
        </button>
    );
}
