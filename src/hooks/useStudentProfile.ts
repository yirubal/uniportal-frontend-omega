import { useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { getPeriodLabel, getProgramLabel } from "../utils/periods";

export function useStudentProfile() {
    const { student } = useAuthStore();

    return useMemo(() => {
        const departmentId = student?.preferred_department ?? null;
        const program = student?.preferred_program ?? null;
        const year = student?.preferred_year ?? null;
        const period = student?.preferred_period ?? null;
        const hasCompleteProfile = Boolean(departmentId && program && year && period);

        return {
            student,
            departmentId,
            program,
            year,
            period,
            hasCompleteProfile,
            programLabel: getProgramLabel(program),
            periodLabel: getPeriodLabel(period, program),
            profileLabel: hasCompleteProfile
                ? `${getProgramLabel(program)} · Year ${year} · ${getPeriodLabel(period, program)}`
                : "Profile incomplete",
        };
    }, [student]);
}
