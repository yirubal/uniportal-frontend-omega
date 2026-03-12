import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getDepartments } from "../api/content";
import { updateMyProfile, getMyProfile } from "../api/auth";
import { Department } from "../store/contentStore";
import Button from "../components/ui/Button";

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];

const STEP_LABELS = ["Department", "Year", "Semester"];

export default function OnboardingScreen() {
    const navigate = useNavigate();
    const { token, setAuth, setLoading } = useAuthStore();

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

    const handleNext = () => {
        if (step < 2) setStep(step + 1);
    };

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

    return (
        <div className="fixed inset-0 flex flex-col bg-[#0A1628] overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-12 pb-6">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🎓</span>
                    <span className="text-[#FFB400] text-sm font-semibold tracking-widest uppercase">
                        Setup
                    </span>
                </div>
                <h1 className="text-white text-2xl font-bold leading-tight mt-2">
                    Personalise your<br />experience
                </h1>
                <p className="text-[#8899AA] text-sm mt-1">
                    Step {step + 1} of 3 — {STEP_LABELS[step]}
                </p>

                {/* Step dots */}
                <div className="flex gap-2 mt-4">
                    {STEP_LABELS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${
                                i <= step ? "bg-[#FFB400]" : "bg-[#1A3A5C]"
                            } ${i === step ? "flex-[2]" : "flex-1"}`}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6">
                {/* Step 0 — Department */}
                {step === 0 && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                        <p className="text-[#8899AA] text-sm mb-2">Select your department</p>
                        {loadingDepts ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-14 rounded-2xl bg-[#1A3A5C]/40 skeleton" />
                            ))
                        ) : (
                            departments.map((dept) => (
                                <button
                                    key={dept.id}
                                    onClick={() => setSelectedDept(dept)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-150 text-left active:scale-[0.98] ${
                                        selectedDept?.id === dept.id
                                            ? "border-[#FFB400] bg-[#FFB400]/10"
                                            : "border-[#1A3A5C] bg-[#1A3A5C]/30"
                                    }`}
                                >
                                    <div>
                                        <p className="text-white font-semibold text-sm">{dept.name}</p>
                                        <p className="text-[#8899AA] text-xs mt-0.5">{dept.code}</p>
                                    </div>
                                    {selectedDept?.id === dept.id && (
                                        <span className="w-6 h-6 rounded-full bg-[#FFB400] flex items-center justify-center text-[#0A1628] text-xs font-black">
                                            ✓
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Step 1 — Year */}
                {step === 1 && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                        <p className="text-[#8899AA] text-sm mb-2">Which year are you in?</p>
                        <div className="grid grid-cols-2 gap-3">
                            {YEARS.map((yr) => (
                                <button
                                    key={yr}
                                    onClick={() => setSelectedYear(yr)}
                                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-150 active:scale-[0.97] ${
                                        selectedYear === yr
                                            ? "border-[#FFB400] bg-[#FFB400]/10"
                                            : "border-[#1A3A5C] bg-[#1A3A5C]/30"
                                    }`}
                                >
                                    <span className="text-3xl font-black text-white">{yr}</span>
                                    <span className="text-[#8899AA] text-xs mt-1">
                                        Year {yr}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2 — Semester */}
                {step === 2 && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                        <p className="text-[#8899AA] text-sm mb-2">Select your current semester</p>
                        <div className="grid grid-cols-2 gap-3">
                            {SEMESTERS.map((sem) => (
                                <button
                                    key={sem}
                                    onClick={() => setSelectedSemester(sem)}
                                    className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-150 active:scale-[0.97] ${
                                        selectedSemester === sem
                                            ? "border-[#FFB400] bg-[#FFB400]/10"
                                            : "border-[#1A3A5C] bg-[#1A3A5C]/30"
                                    }`}
                                >
                                    <span className="text-4xl font-black text-white">{sem}</span>
                                    <span className="text-[#8899AA] text-xs mt-1">
                                        Semester {sem}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-[#F44336] text-sm text-center mt-4">{error}</p>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-10 pt-4 flex flex-col gap-3">
                {step < 2 ? (
                    <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        disabled={!canAdvance}
                        onClick={handleNext}
                    >
                        Continue →
                    </Button>
                ) : (
                    <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        disabled={!canAdvance}
                        loading={saving}
                        onClick={handleFinish}
                    >
                        Finish Setup 🎉
                    </Button>
                )}
                {step > 0 && (
                    <button
                        onClick={() => setStep(step - 1)}
                        className="text-[#8899AA] text-sm text-center py-2"
                    >
                        ← Back
                    </button>
                )}
            </div>
        </div>
    );
}
