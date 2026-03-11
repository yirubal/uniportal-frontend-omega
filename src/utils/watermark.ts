export const drawWatermark = (
    canvas: HTMLCanvasElement,
    text: string
): void => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#0A1628";
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";

    // Rotate diagonally
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const spacing = 120;
    const lineHeight = 60;

    for (let y = -canvas.height; y < canvas.height * 2; y += lineHeight) {
        for (let x = -canvas.width; x < canvas.width * 2; x += spacing) {
            ctx.fillText(text, x, y);
        }
    }

    ctx.restore();
};

export const resizeCanvas = (
    canvas: HTMLCanvasElement,
    container: HTMLElement
): void => {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
};