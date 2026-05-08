import { Download, LoaderCircle, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWatermarkText } from "../api/auth";
import { requestDownload } from "../api/content";
import { useTelegram } from "../hooks/useTelegram";
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
    const { downloadFile } = useTelegram();
    const [downloading, setDownloading] = useState(false);
    const colors = getFileTypeColor(resource.file_type);
    const icon = getFileTypeIcon(resource.file_type);
    const source = resource.source ?? "other";
    const sourceDisplay = resource.source_display ?? "Other Resource";
    const isPremium = resource.access_level === "premium";
    const courseCodes = resource.course_codes ?? [];

    const handleDownload = async () => {
        if (isLocked) {
            navigate("/subscribe");
            return;
        }

        if (downloading) return;

        setDownloading(true);
        try {
            const watermark = await getWatermarkText().catch(() => undefined);
            const response = await requestDownload(resource.id, watermark);
            if (response.url.startsWith("http")) {
                try {
                    downloadFile(response.url, response.filename);
                } catch {
                    window.open(response.url, "_blank", "noopener,noreferrer");
                }
            }
        } catch (error) {
            if (typeof error === "object" && error !== null && "status" in error && error.status === 403) {
                navigate("/subscribe");
            }
        } finally {
            setDownloading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={() => void handleDownload()}
            className="app-sheet app-card-interactive relative flex w-full cursor-pointer flex-col overflow-hidden rounded-[16px] text-left shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
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
                    <p
                        className="line-clamp-2 overflow-hidden text-[0.94rem] font-semibold leading-snug text-[#172B2F]"
                        style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                        }}
                    >
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

            <div className="mt-3 flex items-center justify-between gap-3 pl-[52px]">
                <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${isPremium ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                    {isPremium ? "Premium" : "Free"}
                </span>

                <div className={`mr-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isLocked ? "bg-[rgba(245,229,226,0.96)] text-[#B75F57]" : "bg-[#172B2F] text-white"}`}>
                    {downloading ? <LoaderCircle size={18} className="animate-spin" /> : isLocked ? <Lock size={18} /> : <Download size={18} />}
                </div>
            </div>
        </button>
    );
}
