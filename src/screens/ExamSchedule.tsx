import { AlertCircle, CalendarDays, CheckCircle2, ClipboardList, Clock3, DoorOpen, Search } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchActiveTerm, lookupExamSchedule } from "../api/exams";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import type { ActiveTermResponse, ExamEntry, ExamScheduleResponse } from "../types/exams";

function formatActiveTermLabel(term: ActiveTermResponse, separator = " - ") {
    const termLabel =
        typeof term.year === "number" && typeof term.term === "number"
            ? `${term.year} Term ${term.term}`
            : "Current term";
    const centerLabel = term.center?.trim();

    return centerLabel ? `${termLabel}${separator}${centerLabel}` : termLabel;
}

function groupExamsByDate(exams: ExamEntry[]) {
    const grouped = new Map<string, ExamEntry[]>();

    exams.forEach((exam) => {
        const current = grouped.get(exam.date) ?? [];
        current.push(exam);
        grouped.set(exam.date, current);
    });

    return Array.from(grouped.entries()).map(([date, entries]) => ({
        date,
        entries,
    }));
}

export default function ExamSchedule() {
    const navigate = useNavigate();
    const [activeTerm, setActiveTerm] = useState<ActiveTermResponse | null>(null);
    const [termLoading, setTermLoading] = useState(true);
    const [termError, setTermError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [searchedQuery, setSearchedQuery] = useState("");
    const [schedule, setSchedule] = useState<ExamScheduleResponse | null>(null);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    const loadActiveTerm = useCallback(async () => {
        setTermLoading(true);
        setTermError(null);

        try {
            const term = await fetchActiveTerm();
            setActiveTerm(term);
        } catch (error) {
            setTermError((error as { message?: string })?.message ?? "Failed to load the current exam term.");
        } finally {
            setTermLoading(false);
        }
    }, []);

    useEffect(() => {
        loadActiveTerm();
    }, [loadActiveTerm]);

    const groupedExams = useMemo(
        () => (schedule ? groupExamsByDate(schedule.exams) : []),
        [schedule]
    );

    const resetSearch = useCallback(() => {
        setSchedule(null);
        setLookupError(null);
    }, []);

    const handleBack = useCallback(() => {
        if (schedule || lookupError) {
            resetSearch();
            return;
        }

        navigate("/home");
    }, [lookupError, navigate, resetSearch, schedule]);

    const handleSearch = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        setLookupLoading(true);
        setLookupError(null);
        setSchedule(null);
        setSearchedQuery(trimmedQuery);

        try {
            const result = await lookupExamSchedule(trimmedQuery);

            if (!result.exams.length) {
                setLookupError("No exam found. Check your ID or name spelling.");
                return;
            }

            setSchedule(result);
        } catch (error) {
            setLookupError((error as { message?: string })?.message ?? "Something went wrong. Please try again.");
        } finally {
            setLookupLoading(false);
        }
    }, [query]);

    const isNotFoundError = lookupError?.toLowerCase().includes("no exam found") ?? false;
    const searchAgainLabel = schedule || lookupError ? "Search Again" : "Back";

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={handleBack} label={searchAgainLabel} />
                    <p className="app-section-label">Exam schedule</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">
                        Find your exam room
                    </h1>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#526B70]">
                        {activeTerm?.active
                            ? formatActiveTermLabel(activeTerm)
                            : "Check the current term and search using your Student ID or registered name."}
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact space-y-4">
                {termLoading ? (
                    <>
                        <section className="app-sheet p-5">
                            <Skeleton className="h-5 w-24 rounded-full" />
                            <Skeleton className="mt-3 h-8 w-52 rounded-full" />
                            <Skeleton className="mt-3 h-4 w-full rounded-full" />
                            <Skeleton className="mt-2 h-4 w-3/4 rounded-full" />
                        </section>
                        <section className="app-sheet p-5">
                            <Skeleton className="h-5 w-40 rounded-full" />
                            <Skeleton className="mt-4 h-14 w-full rounded-[20px]" />
                            <Skeleton className="mt-3 h-12 w-full rounded-[18px]" />
                        </section>
                    </>
                ) : termError ? (
                    <ErrorState
                        message={termError}
                        onRetry={loadActiveTerm}
                    />
                ) : !activeTerm?.active ? (
                    <section className="app-sheet p-5">
                        <div className="app-state border border-[rgba(23,43,47,0.06)] bg-white/75 py-10 shadow-none">
                            <span className="app-state-icon mb-4 bg-[#EAF4F1] text-[#3F6F6A]">
                                <ClipboardList size={28} />
                            </span>
                            <p className="text-base font-black text-[#172B2F]">
                                No exam schedule available
                            </p>
                            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#526B70]">
                                No exam schedule is available for the current term.
                            </p>
                        </div>
                    </section>
                ) : (
                    <>
                        {!schedule && !lookupError && (
                            <section className="app-sheet p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="app-section-label">Exam schedule</p>
                                        <h2 className="mt-2 text-xl font-black text-[#172B2F]">
                                            {formatActiveTermLabel(activeTerm)}
                                        </h2>
                                    </div>
                                    <div className="app-icon-chip bg-[#EAF4F1] text-[#3F6F6A]">
                                        <ClipboardList size={20} />
                                    </div>
                                </div>

                                <div className="app-divider mt-5" />

                                <form className="mt-5 space-y-4" onSubmit={handleSearch}>
                                    <div>
                                        <p className="text-base font-black text-[#172B2F]">
                                            Find Your Exam Room
                                        </p>
                                        <p className="mt-2 text-sm leading-relaxed text-[#526B70]">
                                            Enter your Student ID or Full Name as registered at the university.
                                        </p>
                                    </div>

                                    <label className="block">
                                        <span className="sr-only">Student ID or Full Name</span>
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Student ID or Full Name"
                                            className="w-full rounded-[20px] border border-[rgba(23,43,47,0.10)] bg-white/90 px-4 py-3.5 text-sm font-medium text-[#172B2F] outline-none transition-colors placeholder:text-[#8B9CA0] focus:border-[#3F6F6A]"
                                            autoComplete="off"
                                        />
                                    </label>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        fullWidth
                                        loading={lookupLoading}
                                        disabled={!query.trim()}
                                        style={{
                                            backgroundColor: "#172B2F",
                                            borderColor: "#172B2F",
                                            color: "#FFFFFF",
                                        }}
                                    >
                                        <Search size={18} />
                                        Find My Exams
                                    </Button>
                                </form>

                                <div className="mt-4 rounded-[20px] bg-[#F7FAF8] px-4 py-3">
                                    <p className="text-sm leading-relaxed text-[#526B70]">
                                        Can&apos;t find your name? Try your registered name exactly as it appears on your ID card.
                                    </p>
                                </div>
                            </section>
                        )}

                        {lookupLoading && (
                            <>
                                <section className="app-sheet p-5">
                                    <Skeleton className="h-6 w-44 rounded-full" />
                                    <Skeleton className="mt-3 h-4 w-36 rounded-full" />
                                </section>
                                <section className="app-sheet p-5">
                                    <Skeleton className="h-5 w-52 rounded-full" />
                                    <Skeleton className="mt-4 h-28 w-full rounded-[22px]" />
                                    <Skeleton className="mt-3 h-28 w-full rounded-[22px]" />
                                </section>
                            </>
                        )}

                        {schedule && !lookupLoading && (
                            <>
                                <section className="app-sheet p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="app-section-label">Student</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <CheckCircle2 size={18} className="text-[#3C8F71]" />
                                                <h2 className="text-xl font-black text-[#172B2F]">
                                                    {schedule.student_name}
                                                </h2>
                                            </div>
                                            <p className="mt-2 text-sm font-semibold text-[#526B70]">
                                                ID: {schedule.student_id}
                                            </p>
                                            <p className="mt-2 text-sm leading-relaxed text-[#526B70]">
                                                {schedule.term}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {groupedExams.map((group) => (
                                    <section key={group.date} className="app-sheet p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="app-icon-chip bg-[#EAF4F1] text-[#3F6F6A]">
                                                <CalendarDays size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="app-section-label">Exam date</p>
                                                <h3 className="mt-1 text-base font-black text-[#172B2F]">
                                                    {group.date}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            {group.entries.map((exam) => (
                                                <div
                                                    key={`${group.date}-${exam.course_code}-${exam.start_time}`}
                                                    className="rounded-[22px] border border-[rgba(23,43,47,0.08)] bg-white/85 p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="inline-flex items-center gap-2 rounded-full bg-[#F7FAF8] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#70868B]">
                                                                <Clock3 size={14} />
                                                                <span>{exam.start_time} - {exam.end_time}</span>
                                                            </div>

                                                            <p className="mt-3 text-base font-black leading-snug text-[#172B2F]">
                                                                {exam.course_name}
                                                            </p>
                                                            <p className="mt-1 text-sm font-semibold text-[#70868B]">
                                                                {exam.course_code}
                                                            </p>
                                                            <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#70868B]">
                                                                {exam.session}
                                                            </p>
                                                            <p className="mt-1 text-sm text-[#526B70]">
                                                                {exam.department}
                                                            </p>
                                                        </div>

                                                        <div className="shrink-0 rounded-[22px] bg-[#EAF4F1] px-4 py-3 text-center text-[#234C48]">
                                                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3F6F6A]">
                                                                Room
                                                            </p>
                                                            <div className="mt-2 flex items-center justify-center gap-1.5">
                                                                <DoorOpen size={17} />
                                                                <p className="text-[1.55rem] font-black leading-none">
                                                                    {exam.room_code}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </>
                        )}

                        {lookupError && !lookupLoading && (
                            <section className="app-sheet p-5">
                                <div className="app-state border border-[#F4D6D1] bg-[#FFF7F5] py-10 shadow-none">
                                    <span className="app-state-icon mb-4 bg-[#FFF0ED] text-[#D95A50]">
                                        <AlertCircle size={28} />
                                    </span>
                                    <p className="max-w-xs text-base font-black text-[#172B2F]">
                                        {isNotFoundError
                                            ? `No exam found for "${searchedQuery}"`
                                            : "Could not load exam schedule"}
                                    </p>
                                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#526B70]">
                                        {isNotFoundError
                                            ? "Make sure you entered your correct Student ID or full name exactly as registered."
                                            : lookupError}
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="mt-6"
                                        onClick={resetSearch}
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </section>
                        )}

                        <section className="app-sheet border border-[#CFE2DE] bg-[#F7FCFA] p-5">
                            <div className="flex items-start gap-3">
                                <div className="app-icon-chip h-10 w-10 rounded-[16px] bg-[#EAF4F1] text-[#3F6F6A]">
                                    <AlertCircle size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-[#172B2F]">
                                        Arrive at least 15 minutes early.
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-[#526B70]">
                                        Mobile phones are not allowed in exam rooms.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
