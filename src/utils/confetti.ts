import { prefersReducedMotion } from "./motion";

const COLORS = ["#3f6f6a", "#6db5a9", "#d5a84e", "#f1c364", "#4c9b7f", "#d87266", "#7654d6"];

interface Piece {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    rotation: number;
    spin: number;
    color: string;
    shape: "rect" | "circle";
}

/**
 * A short confetti burst from the top of the screen, drawn on a temporary canvas that ignores taps.
 * Returns a function that stops it early. Does nothing when reduced motion is requested.
 */
export function launchConfetti({ count = 140, durationMs = 2600 } = {}): () => void {
    if (prefersReducedMotion() || typeof document === "undefined") return () => {};

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return () => {};

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
        position: "fixed",
        inset: "0",
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: "none",
        zIndex: "200",
    });
    context.scale(ratio, ratio);
    document.body.appendChild(canvas);

    // Two bursts from the upper corners, angled towards the middle.
    const pieces: Piece[] = Array.from({ length: count }, (_, index) => {
        const fromLeft = index % 2 === 0;
        const angle = (fromLeft ? -60 : -120) + (Math.random() - 0.5) * 50;
        const speed = 7 + Math.random() * 7;
        return {
            x: fromLeft ? width * 0.1 : width * 0.9,
            y: height * 0.32,
            vx: Math.cos((angle * Math.PI) / 180) * speed,
            vy: Math.sin((angle * Math.PI) / 180) * speed,
            size: 5 + Math.random() * 6,
            rotation: Math.random() * Math.PI,
            spin: (Math.random() - 0.5) * 0.3,
            color: COLORS[index % COLORS.length],
            shape: Math.random() > 0.3 ? "rect" : "circle",
        };
    });

    const start = performance.now();
    let frame = 0;
    let stopped = false;

    const stop = () => {
        if (stopped) return;
        stopped = true;
        cancelAnimationFrame(frame);
        canvas.remove();
    };

    const draw = (now: number) => {
        const elapsed = now - start;
        if (elapsed > durationMs) {
            stop();
            return;
        }
        // Fade out over the last 600ms.
        context.globalAlpha = Math.min(1, (durationMs - elapsed) / 600);
        context.clearRect(0, 0, width, height);
        for (const piece of pieces) {
            piece.vy += 0.22; // gravity
            piece.vx *= 0.99; // air drag
            piece.vy *= 0.99;
            piece.x += piece.vx;
            piece.y += piece.vy;
            piece.rotation += piece.spin;

            context.save();
            context.translate(piece.x, piece.y);
            context.rotate(piece.rotation);
            context.fillStyle = piece.color;
            if (piece.shape === "rect") {
                context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
            } else {
                context.beginPath();
                context.arc(0, 0, piece.size / 3, 0, Math.PI * 2);
                context.fill();
            }
            context.restore();
        }
        frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return stop;
}
