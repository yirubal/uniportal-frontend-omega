import { useId } from "react";

interface WatermarkProps {
    /** Main line, e.g. the student's name and ID from /api/students/me/watermark/. */
    text: string;
    /** Smaller second line, e.g. the date the document was opened. */
    subtext?: string;
}

/**
 * Tiled diagonal watermark over its positioned parent. Drawn as an SVG pattern so it stays sharp at
 * any zoom level and pixel density. It is a deterrent only (it can be removed in devtools); the
 * server-side watermark on downloaded files is the real protection.
 */
export default function Watermark({ text, subtext }: WatermarkProps) {
    const patternId = useId();

    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <pattern
                    id={patternId}
                    width="340"
                    height="150"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-30)"
                >
                    <text
                        x="0"
                        y="40"
                        fill="#0A1628"
                        fillOpacity="0.13"
                        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                        fontSize="14"
                        fontWeight="700"
                    >
                        {text}
                    </text>
                    {subtext && (
                        <text
                            x="0"
                            y="60"
                            fill="#0A1628"
                            fillOpacity="0.11"
                            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                            fontSize="11"
                            fontWeight="600"
                        >
                            {subtext}
                        </text>
                    )}
                    {/* Second, offset row so gaps between tiles are covered. Tiles clip at their edge, so the
                        row is drawn twice, one tile width apart, and the two clipped halves join seamlessly. */}
                    {[170, -170].map((x) => (
                        <text
                            key={x}
                            x={x}
                            y="115"
                            fill="#0A1628"
                            fillOpacity="0.13"
                            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                            fontSize="14"
                            fontWeight="700"
                        >
                            {text}
                        </text>
                    ))}
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${CSS.escape(patternId)})`} />
        </svg>
    );
}
