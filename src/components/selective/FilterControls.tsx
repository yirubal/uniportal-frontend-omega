import { ChevronDown } from "lucide-react";
import type { Department } from "../../store/contentStore";
import { getPeriodOptions, PROGRAM_OPTIONS, type ProgramType, YEAR_OPTIONS } from "../../utils/periods";
import { Skeleton } from "../ui";
import SegmentedPicker from "./SegmentedPicker";

export default function FilterControls({
    departments,
    loadingDepartments,
    selDept,
    selProgram,
    selYear,
    selPeriod,
    onSelectDepartment,
    onSelectProgram,
    onSelectYear,
    onSelectPeriod,
}: {
    departments: Department[];
    loadingDepartments: boolean;
    selDept: Department | null;
    selProgram: ProgramType | null;
    selYear: number | null;
    selPeriod: number | null;
    onSelectDepartment: (department: Department | null) => void;
    onSelectProgram: (program: ProgramType) => void;
    onSelectYear: (year: number) => void;
    onSelectPeriod: (period: number) => void;
}) {
    return (
        <>
            <p className="mb-3 app-section-label">Department</p>
            {loadingDepartments ? (
                <Skeleton className="mb-5 h-14 rounded-2xl" />
            ) : (
                <div className="mb-5 app-sheet p-4">
                    <div className="relative">
                        <select
                            aria-label="Department"
                            value={selDept?.id ?? ""}
                            onChange={(event) => {
                                const selectedId = Number(event.target.value);
                                onSelectDepartment(departments.find((department) => department.id === selectedId) ?? null);
                            }}
                            className="min-h-14 w-full appearance-none rounded-[20px] border border-line bg-mist px-4 pr-14 text-sm font-semibold text-ink outline-none transition-all duration-150 focus:border-accent/25 focus:bg-card"
                        >
                            <option value="" disabled>
                                Select department
                            </option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 text-subtle shadow-[0_6px_16px_rgba(23,43,47,0.08)]">
                                <ChevronDown size={16} />
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <SegmentedPicker
                label="Program"
                options={PROGRAM_OPTIONS}
                value={selProgram}
                onSelect={onSelectProgram}
            />

            <SegmentedPicker
                label="Year"
                options={YEAR_OPTIONS.map((year) => ({ value: year, label: String(year) }))}
                value={selYear}
                onSelect={onSelectYear}
            />

            <SegmentedPicker
                label="Period"
                options={getPeriodOptions(selProgram)}
                value={selPeriod}
                onSelect={onSelectPeriod}
            />
        </>
    );
}
