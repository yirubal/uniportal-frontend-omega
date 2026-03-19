import { ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Resource } from "../store/contentStore";
import {
    formatDate,
    formatFileType,
    getFileTypeColor,
    getFileTypeIcon,
    truncate,
} from "../utils/format";

interface ResourceCardProps {
    resource: Resource;
    isLocked?: boolean;
}

export default function ResourceCard({
    resource,
    isLocked = false,
}: ResourceCardProps) {
    const navigate = useNavigate();
    const colors = getFileTypeColor(resource.file_type);
    const icon = getFileTypeIcon(resource.file_type);

    const handleTap = () => {
        if (isLocked) {
            navigate("/subscribe");
            return;
        }

        navigate(`/resources/${resource.id}`);
    };

    return (
        <div
            onClick={handleTap}
            className="app-panel relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-[28px] p-4 transition-transform duration-150 active:scale-[0.985]"
        >
            <div
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[18px] text-2xl"
                style={{ backgroundColor: colors.bg }}
            >
                {icon}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span
                        className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                        {formatFileType(resource.file_type)}
                    </span>
                    {isNewResource(resource.created_at) && (
                        <span className="rounded-full bg-[#FFF6DF] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B27614]">
                            New
                        </span>
                    )}
                </div>

                <p className="mt-3 text-base font-semibold leading-snug text-[#18253D]">
                    {truncate(resource.title, 52)}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-[#7F8CA5]">
                    <span>{formatDate(resource.created_at)}</span>
                    {resource.downloads_count > 0 && <span>{resource.downloads_count} downloads</span>}
                    <span>{resource.access_level === "premium" ? "Premium" : "Free"}</span>
                </div>
            </div>

            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isLocked ? "bg-[#FFF0ED] text-[#D95A50]" : "bg-[#18253D] text-white"}`}>
                {isLocked ? <Lock size={16} /> : <ArrowRight size={16} />}
            </div>
        </div>
    );
}

function isNewResource(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
}
