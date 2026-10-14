/** What the in-app viewer can do with a file. */
export type FileFormat =
    | { kind: "pdf" }
    | { kind: "docx" }
    | { kind: "sheet" } // xlsx, csv
    | { kind: "image"; mime: string }
    | { kind: "text" }
    | { kind: "unsupported"; label: string }; // pptx, legacy doc/ppt/xls, tiff, unknown

const IMAGE_MIME: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
};

const LABELS: Record<string, string> = {
    pptx: "PowerPoint",
    ppt: "PowerPoint",
    doc: "Word 97-2003",
    xls: "Excel 97-2003",
    tif: "TIFF image",
    tiff: "TIFF image",
};

/** Extensions the viewer can open; used to decide whether to offer "Open in app" before downloading. */
export const VIEWABLE_EXTENSIONS = new Set(["pdf", "docx", "xlsx", "csv", "txt", ...Object.keys(IMAGE_MIME)]);

/** Lowercase extension from a file name or URL path (query string ignored), or null. */
export function getExtension(nameOrUrl: string | null | undefined): string | null {
    if (!nameOrUrl) return null;
    let path = nameOrUrl;
    try {
        path = new URL(nameOrUrl, "https://x.invalid").pathname;
    } catch {
        // not a URL: treat it as a plain file name
    }
    const match = /\.([a-z0-9]{1,5})$/i.exec(path);
    return match ? match[1].toLowerCase() : null;
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
    return signature.every((byte, index) => bytes[offset + index] === byte);
}

/** Latin-1 view of a slice, for finding ASCII markers such as zip entry names. */
function ascii(bytes: Uint8Array, from: number, to: number) {
    return new TextDecoder("latin1").decode(bytes.subarray(Math.max(0, from), Math.min(bytes.length, to)));
}

/**
 * Picks a viewer from the file's bytes, using the extension only as a tie-breaker. Bytes win because
 * stored names are not always reliable (and locally served files have no extension in the URL).
 */
export function detectFileFormat(bytes: Uint8Array, extension: string | null): FileFormat {
    if (ascii(bytes, 0, 1024).includes("%PDF")) return { kind: "pdf" };

    // Office Open XML files are zips; entry names appear in the local headers (start) and the
    // central directory (end), so checking both ends is enough without unzipping.
    if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
        const names = ascii(bytes, 0, 64 * 1024) + ascii(bytes, bytes.length - 256 * 1024, bytes.length);
        if (names.includes("word/")) return { kind: "docx" };
        if (names.includes("xl/")) return { kind: "sheet" };
        if (names.includes("ppt/")) return { kind: "unsupported", label: LABELS.pptx };
        return { kind: "unsupported", label: "Archive" };
    }

    // Legacy binary Office (doc/xls/ppt): no in-app renderer.
    if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
        return { kind: "unsupported", label: LABELS[extension ?? ""] ?? "Office 97-2003 document" };
    }

    if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return { kind: "image", mime: "image/png" };
    if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { kind: "image", mime: "image/jpeg" };
    if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return { kind: "image", mime: "image/gif" };
    if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && ascii(bytes, 8, 12) === "WEBP") return { kind: "image", mime: "image/webp" };
    if (startsWith(bytes, [0x42, 0x4d])) return { kind: "image", mime: "image/bmp" };
    if (startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) || startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a])) {
        return { kind: "unsupported", label: LABELS.tiff };
    }

    if (extension === "csv") return { kind: "sheet" };
    // Plain text: no NUL bytes in the first chunk.
    if (extension === "txt" || !bytes.subarray(0, 4096).includes(0)) return { kind: "text" };
    if (extension && IMAGE_MIME[extension]) return { kind: "image", mime: IMAGE_MIME[extension] };
    return { kind: "unsupported", label: LABELS[extension ?? ""] ?? "This file type" };
}

/** "2.4 MB", "820 KB". */
export function formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
}
