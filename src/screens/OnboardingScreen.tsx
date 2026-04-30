import { Building2, CheckCircle2, GraduationCap, Layers3, Rows3, Wifi } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDepartments } from "../api/content";
import { updateMyProfile } from "../api/auth";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
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
    { title: "Program", hint: "Program controls whether the app shows semesters or terms.", icon: Wifi },
    { title: "Year", hint: "Your year keeps quizzes and resources relevant.", icon: GraduationCap },
    { title: "Period", hint: "The label changes by program, but the backend still stores a numeric period.", icon: Layers3 },
];

export default function OnboardingScreen() {
    const navigate = useNavigate();
    const { token, setAuth } = useAuthStore();

    const [step, setStep] = useState(0);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completedProfile, setCompletedProfile] = useState<Student | null>(null);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<ProgramType | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

    useEffect(() => {
        getDepartments()
            .then(setDepartments)
            .catch(() => setError("Failed to load departments."))
            .finally(() => setLoadingDepts(false));
    }, []);

    useEffect(() => {
        const validPeriods = getPeriodOptions(selectedProgram).map((item) => item.value);
        if (selectedPeriod && !validPeriods.includes(selectedPeriod)) {
            setSelectedPeriod(null);
        }
    }, [selectedPeriod, selectedProgram]);

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
                <div className="relative z-10 w-full max-w-sm rounded-[32px] border border-[rgba(23,43,47,0.08)] bg-[#FFFFFF] px-6 py-8 text-center shadow-[0_28px_70px_rgba(10,22,40,0.28)] animate-scale-in">
                    <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-[#EAF8F1] text-[#2E9E73] shadow-[0_10px_28px_rgba(46,158,115,0.16)]">
                        <CheckCircle2 size={34} />
                    </div>
                    <p className="app-section-label mt-5 text-[#4E5F7C]">Setup complete</p>
                    <h1 className="mt-2 text-[1.7rem] font-bold text-[#172B2F]">
                        Your study path is ready
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-[#526B70]">
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
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">
                        Personalize your study path
                    </h1>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#526B70]">
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
                            <p className="mt-2 text-base font-semibold text-[#172B2F]">
                                {activeStep.title}
                            </p>
                            <p className="mt-1 text-sm text-[#526B70]">{activeStep.hint}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        {STEP_LABELS.map((item, index) => (
                            <div
                                key={item.title}
                                className={`h-2 rounded-full transition-all duration-300 ${index === step ? "flex-[1.6] bg-[#3F6F6A]" : index < step ? "flex-1 bg-[#BFD8D3]" : "flex-1 bg-[#DDE8E5]"}`}
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
                            ) : (
                                departments.map((dept) => (
                                    <button
                                        key={dept.id}
                                        onClick={() => {
                                            setError(null);
                                            setSelectedDept(dept);
                                            goToNextStep();
                                        }}
                                        className={`app-list-item ${selectedDept?.id === dept.id ? "ring-2 ring-[#3F6F6A]/20" : ""}`}
                                    >
                                        <div className="app-icon-chip">
                                            <Building2 size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-[#172B2F]">{dept.name}</p>
                                            <p className="mt-1 text-xs text-[#70868B]">{dept.code}</p>
                                        </div>
                                        <div className={`rounded-full px-3 py-2 text-xs font-bold ${selectedDept?.id === dept.id ? "tone-blue" : "bg-[#EFF3F8] text-[#70868B]"}`}>
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
                                    className={`app-list-item items-center ${selectedProgram === program.value ? "ring-2 ring-[#3F6F6A]/20" : ""}`}
                                >
                                    <div className="app-icon-chip bg-[#EAF4F1] text-[#3F6F6A]">
                                        <Rows3 size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-[#172B2F]">{program.label}</p>
                                    </div>
                                    <div className={`rounded-full px-3 py-2 text-xs font-bold ${selectedProgram === program.value ? "tone-blue" : "bg-[#EFF3F8] text-[#70868B]"}`}>
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
                                    className={`app-sheet app-card-interactive flex min-h-[168px] flex-col items-center justify-center gap-2 px-5 py-7 text-center transition-all ${selectedYear === year ? "bg-[#F8FBFF] ring-2 ring-[#3F6F6A]/20 shadow-[0_18px_36px_rgba(63,111,106,0.10)]" : ""}`}
                                >
                                    <div className="app-icon-chip bg-[#EAF4F1] text-[#3F6F6A]">
                                        <GraduationCap size={18} />
                                    </div>
                                    <p className="app-section-label pt-1">Academic year</p>
                                    <p className="app-title text-[2rem] font-bold text-[#172B2F]">{year}</p>
                                    <p className="text-sm text-[#526B70]">Year {year}</p>
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
                                    className={`app-sheet app-card-interactive flex min-h-[168px] flex-col items-center justify-center gap-2 px-5 py-7 text-center transition-all ${selectedPeriod === period.value ? "bg-[#F8FBFF] ring-2 ring-[#3F6F6A]/20 shadow-[0_18px_36px_rgba(63,111,106,0.10)]" : ""}`}
                                >
                                    <div className="app-icon-chip bg-[#EAF4F1] text-[#3F6F6A]">
                                        <Layers3 size={18} />
                                    </div>
                                    <p className="app-section-label pt-1">Current period</p>
                                    <p className="app-title text-[1.6rem] font-bold text-[#172B2F]">{period.label}</p>
                                    <p className="text-sm text-[#526B70]">
                                        {selectedProgram ? getPeriodLabel(period.value, selectedProgram) : period.label}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="mt-4 text-center text-sm text-[#D95A50]">{error}</p>
                )}
            </div>

            <div className="app-footer">
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
            </div>

        </div>
    );
}
