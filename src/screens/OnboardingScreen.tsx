import { Building2, GraduationCap, Layers3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDepartments } from "../api/content";
import { getMyProfile, updateMyProfile } from "../api/auth";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { useAuthStore } from "../store/authStore";
import type { Department } from "../store/contentStore";

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];

const STEP_LABELS = [
    { title: "Department", hint: "Choose the academic lane you want the app to prioritise.", icon: Building2 },
    { title: "Year", hint: "Your current year keeps notes and quizzes relevant.", icon: GraduationCap },
    { title: "Semester", hint: "Semester filters keep the library compact and easier to scan.", icon: Layers3 },
];

export default function OnboardingScreen() {
    const navigate = useNavigate();
    const { token, setAuth } = useAuthStore();

    const [step, setStep] = useState(0);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

    useEffect(() => {
        getDepartments()
            .then(setDepartments)
            .catch(() => setError("Failed to load departments."))
            .finally(() => setLoadingDepts(false));
    }, []);

    const canAdvance =
        (step === 0 && selectedDept !== null) ||
        (step === 1 && selectedYear !== null) ||
        (step === 2 && selectedSemester !== null);

    const handleFinish = async () => {
        if (!selectedDept || !selectedYear || !selectedSemester) return;

        setSaving(true);
        setError(null);

        try {
            await updateMyProfile({
                preferred_department: selectedDept.id,
                preferred_year: selectedYear,
                preferred_semester: selectedSemester,
                onboarding_complete: true,
            });

            const updated = await getMyProfile();
            setAuth(token!, updated);
            navigate("/home", { replace: true });
        } catch {
            setError("Something went wrong. Please try again.");
            setSaving(false);
        }
    };

    const activeStep = STEP_LABELS[step];
    const StepIcon = activeStep.icon;

    return (
        <div className="app-screen">
            <div className="app-hero">
                <div className="relative z-10">
                    <TopBackButton
                        onClick={() => {
                            if (step > 0) {
                                setStep((current) => current - 1);
                                return;
                            }
                            navigate("/");
                        }}
                        label={step > 0 ? "Previous step" : "Back"}
                    />
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/10 text-white backdrop-blur">
                        <StepIcon size={22} />
                    </div>
                    <p className="app-section-label text-white/70">Student setup</p>
                    <h1 className="app-title mt-2 text-[2rem] font-bold text-white">
                        Personalise your study path
                    </h1>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/72">
                        Start with the essentials so the mini app stays uncluttered and only shows the most relevant material.
                    </p>
                </div>

                <div className="relative z-10 mt-6 app-panel rounded-[28px] p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="app-section-label">Step {step + 1} of 3</p>
                            <p className="mt-2 text-base font-semibold text-[#18253D]">
                                {activeStep.title}
                            </p>
                            <p className="mt-1 text-sm text-[#53627D]">{activeStep.hint}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        {STEP_LABELS.map((item, index) => (
                            <div
                                key={item.title}
                                className={`h-2 rounded-full transition-all duration-300 ${index === step ? "flex-[1.6] bg-[#2D5BFF]" : index < step ? "flex-1 bg-[#B9CBFF]" : "flex-1 bg-[#E6ECFA]"}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="app-scroll">
                {step === 0 && (
                    <div className="grid gap-3">
                        {loadingDepts ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="skeleton h-20 rounded-[24px]" />
                            ))
                        ) : (
                            departments.map((dept) => (
                                <button
                                    key={dept.id}
                                    onClick={() => setSelectedDept(dept)}
                                    className={`app-panel flex items-center justify-between rounded-[28px] p-4 text-left transition-transform duration-200 active:scale-[0.985] ${selectedDept?.id === dept.id ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                                >
                                    <div>
                                        <p className="text-base font-semibold text-[#18253D]">{dept.name}</p>
                                        <p className="mt-1 text-sm text-[#7F8CA5]">{dept.code}</p>
                                    </div>
                                    <div className={`rounded-full px-3 py-2 text-xs font-bold ${selectedDept?.id === dept.id ? "tone-blue" : "bg-[#F4F6FB] text-[#7F8CA5]"}`}>
                                        {selectedDept?.id === dept.id ? "Selected" : "Choose"}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {step === 1 && (
                    <div className="app-grid-2">
                        {YEARS.map((year) => (
                            <button
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={`app-panel min-h-[142px] rounded-[28px] p-5 text-left transition-transform duration-200 active:scale-[0.985] ${selectedYear === year ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                            >
                                <p className="app-section-label">Academic year</p>
                                <p className="app-title mt-5 text-[2.2rem] font-bold text-[#18253D]">{year}</p>
                                <p className="mt-2 text-sm text-[#53627D]">Year {year} content focus</p>
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="app-grid-2">
                        {SEMESTERS.map((semester) => (
                            <button
                                key={semester}
                                onClick={() => setSelectedSemester(semester)}
                                className={`app-panel min-h-[160px] rounded-[28px] p-5 text-left transition-transform duration-200 active:scale-[0.985] ${selectedSemester === semester ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                            >
                                <p className="app-section-label">Current term</p>
                                <p className="app-title mt-5 text-[2.4rem] font-bold text-[#18253D]">{semester}</p>
                                <p className="mt-2 text-sm text-[#53627D]">Semester {semester}</p>
                            </button>
                        ))}
                    </div>
                )}

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
                    onClick={() => {
                        if (step < 2) {
                            setStep((current) => current + 1);
                            return;
                        }

                        void handleFinish();
                    }}
                >
                    {step < 2 ? "Continue" : "Finish setup"}
                </Button>

                {step > 0 && (
                    <button
                        onClick={() => setStep((current) => current - 1)}
                        className="mt-3 w-full text-center text-sm font-medium text-[#53627D]"
                    >
                        Back
                    </button>
                )}
            </div>
        </div>
    );
}
