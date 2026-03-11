import { useNavigate } from "react-router-dom";
import { Resource } from "../store/contentStore";
import {
    formatFileType,
    formatDate,
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
            className="bg-white rounded-2xl p-4 flex items-center gap-3
                 shadow-[0_1px_8px_rgba(0,0,0,0.06)]
                 active:scale-[0.98] transition-transform duration-150
                 cursor-pointer relative overflow-hidden"
        >
            {/* File type icon */}
            <div
                className="w-11 h-11 rounded-xl flex items-center
                   justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: colors.bg }}
            >
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A] mb-1 leading-snug">
                    {truncate(resource.title, 48)}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Type badge */}
                    <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
            {formatFileType(resource.file_type)}
          </span>
                    {/* Date */}
                    <span className="text-[10px] text-[#999]">
            {formatDate(resource.created_at)}
          </span>
                    {/* Download count */}
                    {resource.downloads_count > 0 && (
                        <span className="text-[10px] text-[#999]">
              ↓ {resource.downloads_count}
            </span>
                    )}
                </div>
            </div>

            {/* Right side */}
            {isLocked ? (
                <div
                    className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex
                     items-center justify-center flex-shrink-0"
                >
                    <span className="text-sm">🔒</span>
                </div>
            ) : (
                <div
                    className="w-8 h-8 rounded-lg bg-[#0A1628] flex
                     items-center justify-center flex-shrink-0"
                >
                    <span className="text-xs text-[#FFB400] font-bold">›</span>
                </div>
            )}

            {/* New badge */}
            {isNewResource(resource.created_at) && (
                <div
                    className="absolute top-2 right-2 bg-[#FFB400] text-[#0A1628]
                     text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                >
                    NEW
                </div>
            )}
        </div>
    );
}

function isNewResource(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays =
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
}