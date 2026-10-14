import { Download, LoaderCircle, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useResourceDownload } from "../hooks/useResourceDownload";
import type { Resource } from "../store/contentStore";
import { ResourceSourceBadge } from "./ResourceSourceBadge";
import {
    formatDate,
    formatFileType,
    getFileTypeColor,
    getFileTypeIcon,
} from "../utils/format";

interface ResourceCardProps {
    resource: Resource;
    isLocked?: boolean;
    showCourseContext?: boolean;
}

export default function ResourceCard({
    resource,
    isLocked = false,
    showCourseContext = false,
}: ResourceCardProps) {
    const navigate = useNavigate();
    const { download, downloading, message } = useResourceDownload();
    const colors = getFileTypeColor(resource.file_type);
    const icon = getFileTypeIcon(resource.file_type);
    const source = resource.source ?? "other";
    const sourceDisplay = resource.source_display ?? "Other Resource";
    const isPremium = resource.access_level === "premium";
    const courseCodes = resource.course_codes ?? [];

    return (
        <div className="app-sheet app-card-interactive overflow-hidden rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            {/* The card opens the detail screen (reader, description, related); download is its own button. */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => navigate(`/resources/${resource.id}`)}
                    className="flex w-full cursor-pointer flex-col text-left"
                    style={{ paddingInline: "1rem", paddingBlock: "1.15rem" }}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-[1.05rem]"
                            style={{ backgroundColor: colors.bg }}
                        >
                            {icon}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[0.94rem] font-semibold leading-snug text-[#172B2F]">
                                {resource.title}
                            </p>

                            <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                                <ResourceSourceBadge source={source} source_display={sourceDisplay} size="xs" />
                                <span className="text-xs font-medium text-[#72809a]">
                                    · {formatFileType(resource.file_type)}
                                </span>
                            </div>

                            <p className="mt-1.5 text-xs font-medium text-[#9AA6B8]">
                                {formatDate(resource.created_at)} · {resource.downloads_count} downloads
                            </p>
                            {showCourseContext && courseCodes.length > 0 && (
                                <p className="mt-0.5 text-xs font-medium text-[#9AA6B8]">
                                    {courseCodes.join(" · ")}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 flex min-h-10 items-center pl-[52px]">
                        <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${isPremium ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                            {isPremium ? "Premium" : "Free"}
                        </span>
                    </div>
                </button>

                <button
                    type="button"
                    aria-label={isLocked ? `Unlock ${resource.title}` : `Download ${resource.title}`}
                    disabled={downloading}
                    onClick={() => (isLocked ? navigate("/subscribe") : void download(resource.id))}
                    className={`absolute bottom-[1.15rem] right-[1.125rem] flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95 ${isLocked ? "bg-[rgba(245,229,226,0.96)] text-[#B75F57]" : "bg-[#172B2F] text-white"}`}
                >
                    {downloading ? <LoaderCircle size={18} className="animate-spin" /> : isLocked ? <Lock size={18} /> : <Download size={18} />}
                </button>
            </div>

            {message && (
                <p
                    role={message.tone === "error" ? "alert" : "status"}
                    className={`px-4 pb-3 text-xs font-semibold ${message.tone === "error" ? "text-[#B4473F]" : "text-[#2E7C62]"}`}
                >
                    {message.text}
                </p>
            )}
        </div>
    );
}
