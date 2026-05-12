import { AlertCircle, CalendarDays, ClipboardList, Clock3, DoorOpen, Search } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchActiveTerm, lookupExamSchedule } from "../api/exams";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { Skeleton } from "../components/ui";
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
    const [lookupStatus, setLookupStatus] = useState<number | null>(null);
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
    const activeTermLabel = activeTerm?.active ? formatActiveTermLabel(activeTerm) : "Current exam schedule";
    const showTermNotice = !schedule && (Boolean(termError) || (!termLoading && activeTerm?.active === false));

    const resetSearch = useCallback(() => {
        setSchedule(null);
        setLookupError(null);
        setLookupStatus(null);
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
        setLookupStatus(null);
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
            const apiError = error as { message?: string; status?: number };
            setLookupStatus(apiError.status ?? null);
            setLookupError(apiError.message ?? "Something went wrong. Please try again.");
        } finally {
            setLookupLoading(false);
        }
    }, [query]);

    const isNotFoundError = lookupError?.toLowerCase().includes("no exam found") ?? false;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const lookupErrorTitle =
        isNotFoundError
            ? `No exam found for "${searchedQuery}"`
            : lookupStatus === 401
                ? "Session expired"
                : lookupStatus === 403
                    ? "Access blocked"
                    : lookupStatus === 404
                        ? "Exam schedule endpoint returned no result"
                        : "Could not load exam schedule";
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
                        {schedule
                            ? schedule.term
                            : activeTerm?.active
                                ? formatActiveTermLabel(activeTerm)
                                : "Check the current term and search using your Student ID or registered name."}
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact space-y-4">
                {!schedule && !lookupError && (
                    <section className="app-sheet p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="app-section-label">Exam schedule</p>
                                <h2 className="mt-2 text-xl font-black text-[#172B2F]">
                                    {termLoading ? "Checking current term..." : activeTermLabel}
                                </h2>
                            </div>
                            <div className="app-icon-chip bg-[#EAF4F1] text-[#3F6F6A]">
                                <ClipboardList size={20} />
                            </div>
                        </div>

                        <div className="app-divider mt-5" />

                        {showTermNotice && (
                            <div className="mt-5 rounded-[20px] border border-[#F4D6D1] bg-[#FFF7F5] px-4 py-3">
                                <p className="text-sm font-bold text-[#172B2F]">
                                    Could not confirm the active term.
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-[#526B70]">
                                    You can still search your exam room. The lookup request will check the schedule directly.
                                </p>
                                <Button
                                    type="button"
                                    onClick={loadActiveTerm}
                                    size="sm"
                                    className="mt-3"
                                >
                                    Retry term check
                                </Button>
                            </div>
                        )}

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
                        <p className="mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-medium text-[#70868B]">
                            <span>{schedule.student_name}</span>
                            {schedule.student_id && (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span>ID: {schedule.student_id}</span>
                                </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span>{schedule.exams.length} {schedule.exams.length === 1 ? "exam" : "exams"} found</span>
                        </p>

                        {groupedExams.map((group) => (
                            <section key={group.date} className="mt-5 first:mt-0">
                                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#172B2F]">
                                    <CalendarDays size={16} className="text-[#3F6F6A]" />
                                    <h2>{group.date}</h2>
                                </div>

                                <div className="space-y-2">
                                    {group.entries.map((exam) => (
                                        <div
                                            key={`${group.date}-${exam.course_code}-${exam.start_time}`}
                                            className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-[#70868B]">
                                                    <Clock3 size={14} className="shrink-0" />
                                                    <span className="truncate">{exam.start_time} – {exam.end_time}</span>
                                                </div>

                                                <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#172B2F] px-3 py-1 text-base font-bold leading-none text-white">
                                                    <DoorOpen size={15} />
                                                    <span>{exam.room_code}</span>
                                                </div>
                                            </div>

                                            <p className="mt-2 line-clamp-2 break-words text-sm font-semibold leading-snug text-[#172B2F]">
                                                {exam.course_name}
                                            </p>
                                            <p className="mt-1 min-w-0 truncate text-xs font-medium text-[#8B9CA0]">
                                                {exam.course_code} · {exam.department}
                                            </p>
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
                                {lookupErrorTitle}
                            </p>
                            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#526B70]">
                                {isNotFoundError
                                    ? "Make sure you entered your correct Student ID or full name exactly as registered."
                                    : lookupError}
                            </p>
                            {import.meta.env.DEV && lookupStatus && (
                                <p className="mt-3 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-[#8A4B3F]">
                                    API status: {lookupStatus}
                                </p>
                            )}
                            {import.meta.env.DEV && !lookupStatus && (
                                <p className="mt-3 max-w-xs rounded-[14px] bg-white/70 px-3 py-2 text-xs font-bold leading-relaxed text-[#8A4B3F]">
                                    API base: {apiBaseUrl || "not configured"}
                                </p>
                            )}
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

                {schedule ? (
                    <p className="mt-6 px-4 text-center text-xs leading-relaxed text-[#8B9CA0]">
                        Arrive at least 15 minutes early. Mobile phones are not allowed in exam rooms.
                    </p>
                ) : (
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
                )}
            </div>
        </div>
    );
}
