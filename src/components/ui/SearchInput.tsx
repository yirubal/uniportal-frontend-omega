import { Search } from "lucide-react";

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

/** Text input with a leading search icon. The placeholder doubles as the accessible label. */
export default function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
    return (
        <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#70868B]" size={16} aria-hidden="true" />
            <input
                type="text"
                aria-label={placeholder}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                style={{ paddingInlineStart: "2.85rem" }}
                className="app-input pl-10"
            />
        </div>
    );
}
