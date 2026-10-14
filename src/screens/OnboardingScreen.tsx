import { Building2, CheckCircle2, GraduationCap, Layers3, Route, Rows3 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDepartments } from "../api/content";
import { updateMyProfile } from "../api/auth";
import ConfirmDialog from "../components/ConfirmDialog";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState } from "../components/ui";
import { useAsyncData } from "../hooks/useAsyncData";
import { useTelegram } from "../hooks/useTelegram";
import { Student, useAuthStore } from "../store/authStore";
import type { Department } from "../store/contentStore";
import {
    getPeriodLabel,
    getPeriodOptions,
    PROGRAM_OPTIONS,
    type ProgramType,
    YEAR_OPTIONS,
} from "../utils/periods";

const STEP_LABELS = [
    { title: "Department", hint: "Pick the academic lane the app should prioritize.", icon: Building2 },
    { title: "Program", hint: "Regular, extension or distance. This decides whether you see semesters or terms.", icon: Route },
    { title: "Year", hint: "Your year keeps quizzes and resources relevant.", icon: GraduationCap },
    { title: "Period", hint: "The semester or term you are studying now.", icon: Layers3 },
];

type TelegramWindow = Window & {
    Telegram?: {
        WebApp?: {
            initData?: string;
        };
    };
};

const NO_DEPARTMENTS: Department[] = [];

export default function OnboardingScreen() {
    const navigate = useNavigate();
    const { close } = useTelegram();
    const { token, setAuth, student } = useAuthStore(
        useShallow((state) => ({
            token: state.token,
            setAuth: state.setAuth,
            student: state.student,
        }))
    );

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completedProfile, setCompletedProfile] = useState<Student | null>(null);
    // "Update setup" from Home reopens this screen: start from the saved profile instead of blank.
    const [selectedProgram, setSelectedProgram] = useState<ProgramType | null>(student?.preferred_program ?? null);
    const [selectedYear, setSelectedYear] = useState<number | null>(student?.preferred_year ?? null);
    const [rawSelectedPeriod, setSelectedPeriod] = useState<number | null>(student?.preferred_period ?? null);
    // A period that doesn't exist for the chosen program (e.g. semester 2 after switching to distance) reads as unset.
    const selectedPeriod = rawSelectedPeriod && getPeriodOptions(selectedProgram).some((item) => item.value === rawSelectedPeriod)
        ? rawSelectedPeriod
        : null;

    const departmentsData = useAsyncData("departments", (signal) => getDepartments({ signal }));
    const departments = departmentsData.data ?? NO_DEPARTMENTS;
    const loadingDepts = departmentsData.loading;
    const departmentsError = Boolean(departmentsData.error);
    const loadDepartments = departmentsData.reload;
    // Starts on the saved department so "Update setup" from Home opens with the current profile selected.
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(student?.preferred_department ?? null);
    const selectedDept = departments.find((item) => item.id === selectedDeptId) ?? null;

    const periodOptions = useMemo(() => getPeriodOptions(selectedProgram), [selectedProgram]);

    const canAdvance =
        (step === 0 && selectedDept !== null) ||
        (step === 1 && selectedProgram !== null) ||
        (step === 2 && selectedYear !== null) ||
        (step === 3 && selectedPeriod !== null);

    const goToNextStep = () => {
        setStep((current) => Math.min(current + 1, STEP_LABELS.length - 1));
    };

    const handleFinish = async () => {
        if (!selectedDept || !selectedProgram || !selectedYear || !selectedPeriod) return;

        setSaving(true);
        setError(null);

        try {
            const updatedProfile = await updateMyProfile({
                preferred_department: selectedDept.id,
                preferred_program: selectedProgram,
                preferred_year: selectedYear,
                preferred_period: selectedPeriod,
                onboarding_complete: true,
            });
            setSaving(false);
            setCompletedProfile(updatedProfile);
            setShowSuccess(true);
        } catch {
            setError("Something went wrong. Please try again.");
            setSaving(false);
        }
    };

    const handleLeaveApp = () => {
        setShowCancelConfirm(false);

        const telegramWebApp = (window as TelegramWindow).Telegram?.WebApp;
        if (telegramWebApp?.initData) {
            close();
            return;
        }

        window.close();
    };

    const activeStep = STEP_LABELS[step];
    const StepIcon = activeStep.icon;
    const primaryActionStyle = {
        backgroundColor: "var(--tg-button-color)",
        color: "var(--tg-button-text-color)",
        borderColor: "color-mix(in srgb, var(--tg-button-color) 78%, white 22%)",
    } as const;

    if (showSuccess) {
        return (
            <div className="app-screen items-center justify-center px-5">
                <div className="absolute inset-0 bg-[rgba(8,18,34,0.62)] backdrop-blur-sm" />
                <div className="relative z-10 w-full max-w-sm rounded-[32px] border border-[rgba(23,43,47,0.08)] bg-white px-6 py-8 text-center shadow-[0_28px_70px_rgba(10,22,40,0.28)] animate-scale-in">
                    <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-success-tint text-success-ink shadow-[0_10px_28px_rgba(46,158,115,0.16)]">
                        <CheckCircle2 size={34} />
                    </div>
                    <p className="app-section-label mt-5 text-[#4E5F7C]">Setup complete</p>
                    <h1 className="mt-2 text-[1.7rem] font-bold text-ink">
                        Your study path is ready
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-subtle">
                        Department, program, year, and period were saved successfully. The app can now load the right courses for you.
                    </p>
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        className="mt-6"
                        style={primaryActionStyle}
                        onClick={() => {
                            if (token && completedProfile) {
                                setAuth(token, completedProfile);
                            }
                            navigate("/home", { replace: true });
                        }}
                    >
                        Continue to home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton
                        onClick={() => {
                            if (step > 0) {
                                setStep((current) => current - 1);
                                return;
                            }
                            navigate("/");
                        }}
                        label={step > 0 ? "Previous" : "Back"}
                    />
                    <p className="app-section-label">Student setup</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-ink">
                        Personalize your study path
                    </h1>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-subtle">
                        Four quick choices so the mini app stays focused on the right courses.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <div className="app-sheet p-4">
                    <div className="flex items-start gap-3">
                        <div className="app-icon-chip">
                            <StepIcon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="app-section-label">Step {step + 1} of 4</p>
                            <p className="mt-2 text-base font-semibold text-ink">
                                {activeStep.title}
                            </p>
                            <p className="mt-1 text-sm text-subtle">{activeStep.hint}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        {STEP_LABELS.map((item, index) => (
                            <div
                                key={item.title}
                                className={`h-2 rounded-full transition-all duration-300 ${index === step ? "flex-[1.6] bg-accent" : index < step ? "flex-1 bg-[#BFD8D3]" : "flex-1 bg-[#DDE8E5]"}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-4 pb-2">
                    {step === 0 && (
                        <div className="space-y-3">
                            {loadingDepts ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <div key={index} className="skeleton h-20 rounded-[24px]" />
                                ))
                            ) : departmentsError ? (
                                <ErrorState message="Failed to load departments." onRetry={loadDepartments} />
                            ) : (
                                departments.map((dept) => (
                                    <button
                                        key={dept.id}
                                        onClick={() => {
                                            setError(null);
                                            setSelectedDeptId(dept.id);
                                            goToNextStep();
                                        }}
                                        className={`app-list-item ${selectedDept?.id === dept.id ? "ring-2 ring-accent/20" : ""}`}
                                    >
                                        <div className="app-icon-chip">
                                            <Building2 size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-ink">{dept.name}</p>
                                            <p className="mt-1 text-xs text-faint">{dept.code}</p>
                                        </div>
                                        <div className={`rounded-full px-3 py-2 text-xs font-bold ${selectedDept?.id === dept.id ? "tone-blue" : "bg-[#EFF3F8] text-faint"}`}>
                                            {selectedDept?.id === dept.id ? "Selected" : "Choose"}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-3">
                            {PROGRAM_OPTIONS.map((program) => (
                                <button
                                    key={program.value}
                                    onClick={() => {
                                        setError(null);
                                        setSelectedProgram(program.value);
                                        goToNextStep();
                                    }}
                                    className={`app-list-item items-center ${selectedProgram === program.value ? "ring-2 ring-accent/20" : ""}`}
                                >
                                    <div className="app-icon-chip bg-accent-soft text-accent">
                                        <Rows3 size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-ink">{program.label}</p>
                                    </div>
                                    <div className={`rounded-full px-3 py-2 text-xs font-bold ${selectedProgram === program.value ? "tone-blue" : "bg-[#EFF3F8] text-faint"}`}>
                                        {selectedProgram === program.value ? "Selected" : "Choose"}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="app-grid-2">
                            {YEAR_OPTIONS.map((year) => (
                                <button
                                    key={year}
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setSelectedYear(year);
                                        goToNextStep();
                                    }}
                                    className={`app-sheet app-card-interactive flex min-h-[168px] flex-col items-center justify-center gap-2 px-5 py-7 text-center transition-all ${selectedYear === year ? "bg-[#F8FBFF] ring-2 ring-accent/20 shadow-[0_18px_36px_rgba(63,111,106,0.10)]" : ""}`}
                                >
                                    <div className="app-icon-chip bg-accent-soft text-accent">
                                        <GraduationCap size={18} />
                                    </div>
                                    <p className="app-section-label pt-1">Academic year</p>
                                    <p className="app-title text-[2rem] font-bold text-ink">{year}</p>
                                    <p className="text-sm text-subtle">Year {year}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="app-grid-2">
                            {periodOptions.map((period) => (
                                <button
                                    key={period.value}
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setSelectedPeriod(period.value);
                                    }}
                                    className={`app-sheet app-card-interactive flex min-h-[168px] flex-col items-center justify-center gap-2 px-5 py-7 text-center transition-all ${selectedPeriod === period.value ? "bg-[#F8FBFF] ring-2 ring-accent/20 shadow-[0_18px_36px_rgba(63,111,106,0.10)]" : ""}`}
                                >
                                    <div className="app-icon-chip bg-accent-soft text-accent">
                                        <Layers3 size={18} />
                                    </div>
                                    <p className="app-section-label pt-1">Current period</p>
                                    <p className="app-title text-[1.6rem] font-bold text-ink">{period.label}</p>
                                    <p className="text-sm text-subtle">
                                        {selectedProgram ? getPeriodLabel(period.value, selectedProgram) : period.label}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="mt-4 text-center text-sm text-danger">{error}</p>
                )}
            </div>

            <div className="app-footer space-y-3">
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!canAdvance}
                    loading={saving}
                    style={primaryActionStyle}
                    onClick={() => {
                        if (step < 3) {
                            setStep((current) => current + 1);
                            return;
                        }

                        void handleFinish();
                    }}
                >
                    {step < 3 ? "Continue" : "Finish setup"}
                </Button>
                <Button
                    variant="ghost"
                    size="md"
                    fullWidth
                    disabled={saving}
                    onClick={() => setShowCancelConfirm(true)}
                >
                    Cancel setup
                </Button>
            </div>

            <ConfirmDialog
                open={showCancelConfirm}
                title="Leave setup?"
                description="You can skip these setup steps for now and leave the mini app. Your study path will not be saved until you finish setup."
                confirmLabel="Leave app"
                cancelLabel="Stay in setup"
                onConfirm={handleLeaveApp}
                onCancel={() => setShowCancelConfirm(false)}
            />

        </div>
    );
}
