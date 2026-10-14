import { useCallback, useEffect, useMemo, useState } from "react";
import { getCourses, getDepartments } from "../api/content";
import type { Course, Department } from "../store/contentStore";
import { getPeriodOptions, type ProgramType } from "../utils/periods";
import { useStudentProfile } from "./useStudentProfile";

export interface CourseFilterValues {
    departmentId: number | null;
    program: ProgramType | null;
    year: number | null;
    period: number | null;
}

interface CourseFilterOptions {
    /** Use the saved profile's values instead of the student's own picks. */
    tailored: boolean;
    /** Starting picks for the custom (non-tailored) mode. */
    initial: CourseFilterValues;
}

type DepartmentsState = { status: "loading" | "ready" | "error"; items: Department[] };
type CoursesResult = { key: string | null; courses: Course[]; error: string | null };

/**
 * The department → program → year → period → courses picker shared by Resources, Practice setup and
 * Selective practice. Values are derived rather than synced in effects: in tailored mode they come from
 * the saved profile, a period that doesn't exist for the chosen program reads as null, and course results
 * are keyed by the filter combination so a stale list is never shown for new filters.
 */
export function useCourseFilter({ tailored, initial }: CourseFilterOptions) {
    const profile = useStudentProfile();
    const [departmentsState, setDepartmentsState] = useState<DepartmentsState>({ status: "loading", items: [] });
    const [departmentsReloadKey, setDepartmentsReloadKey] = useState(0);
    const [chosen, setChosen] = useState<CourseFilterValues>(initial);
    const [coursesResult, setCoursesResult] = useState<CoursesResult>({ key: null, courses: [], error: null });
    const [coursesReloadKey, setCoursesReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        getDepartments({ signal: controller.signal })
            .then((items) => {
                if (!controller.signal.aborted) setDepartmentsState({ status: "ready", items });
            })
            .catch(() => {
                if (!controller.signal.aborted) setDepartmentsState({ status: "error", items: [] });
            });

        return () => controller.abort();
    }, [departmentsReloadKey]);

    const values: CourseFilterValues = tailored
        ? { departmentId: profile.departmentId, program: profile.program, year: profile.year, period: profile.period }
        : chosen;
    const { program, year } = values;
    const period = values.period && getPeriodOptions(program).some((item) => item.value === values.period)
        ? values.period
        : null;
    const department = useMemo(
        () => departmentsState.items.find((item) => item.id === values.departmentId) ?? null,
        [departmentsState.items, values.departmentId]
    );
    const departmentId = department?.id ?? null;
    const isComplete = Boolean(departmentId && program && year && period);
    const coursesKey = isComplete ? `${departmentId}|${program}|${year}|${period}|${coursesReloadKey}` : null;

    useEffect(() => {
        if (!coursesKey || !departmentId || !program || !year || !period) return;

        // Abort when filters change so an older, slower response can't overwrite the newer list.
        const controller = new AbortController();

        getCourses(departmentId, program, year, period, { signal: controller.signal })
            .then((courses) => {
                if (!controller.signal.aborted) setCoursesResult({ key: coursesKey, courses, error: null });
            })
            .catch(() => {
                if (!controller.signal.aborted) setCoursesResult({ key: coursesKey, courses: [], error: "Failed to load courses." });
            });

        return () => controller.abort();
    }, [coursesKey, departmentId, program, year, period]);

    const coursesAreCurrent = coursesKey !== null && coursesResult.key === coursesKey;

    const update = useCallback((patch: Partial<CourseFilterValues>) => {
        setChosen((current) => ({ ...current, ...patch }));
    }, []);

    return {
        departments: departmentsState.items,
        departmentsLoading: departmentsState.status === "loading",
        departmentsError: departmentsState.status === "error",
        reloadDepartments: () => {
            setDepartmentsState((current) => ({ ...current, status: "loading" }));
            setDepartmentsReloadKey((key) => key + 1);
        },

        department,
        program,
        year,
        period,
        setDepartment: (next: Department | null) => update({ departmentId: next?.id ?? null }),
        setProgram: (next: ProgramType | null) => update({ program: next }),
        setYear: (next: number | null) => update({ year: next }),
        setPeriod: (next: number | null) => update({ period: next }),

        /** All four filters are set, so courses can be loaded. */
        isComplete,
        /** Tailored mode can't resolve the saved department (load failed, or it's no longer listed). */
        departmentMissing: tailored && departmentsState.status !== "loading" && !department,

        courses: coursesAreCurrent ? coursesResult.courses : [],
        coursesLoading: isComplete && !coursesAreCurrent,
        coursesError: coursesAreCurrent ? coursesResult.error : null,
        reloadCourses: () => setCoursesReloadKey((key) => key + 1),
    };
}
