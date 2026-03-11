import { useEffect, useRef } from "react";
import { drawWatermark, resizeCanvas } from "../utils/watermark";

interface WatermarkProps {
    text: string;
}

export default function Watermark({ text }: WatermarkProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const render = () => {
            resizeCanvas(canvas, container);
            drawWatermark(canvas, text);
        };

        render();

        const observer = new ResizeObserver(render);
        observer.observe(container);

        return () => observer.disconnect();
    }, [text]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 pointer-events-none z-10"
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />
        </div>
    );
}