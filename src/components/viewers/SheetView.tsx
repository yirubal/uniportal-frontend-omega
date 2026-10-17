import { useEffect, useState } from "react";

type Cell = string | number | boolean | Date | null;
type Sheet = { name: string; rows: Cell[][]; truncated: boolean };

/** Large sheets are cut off so a phone stays responsive; the student can download the full file. */
const MAX_ROWS = 500;
const MAX_COLUMNS = 40;

function limit(rows: Cell[][]): { rows: Cell[][]; truncated: boolean } {
    const truncated = rows.length > MAX_ROWS || rows.some((row) => row.length > MAX_COLUMNS);
    return { rows: rows.slice(0, MAX_ROWS).map((row) => row.slice(0, MAX_COLUMNS)), truncated };
}

/** RFC 4180 CSV: quoted fields, escaped quotes ("") and newlines inside quotes. */
function parseCsv(text: string): Cell[][] {
    const rows: Cell[][] = [];
    let row: Cell[] = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
            else if (char === '"') quoted = false;
            else field += char;
        } else if (char === '"') quoted = true;
        else if (char === ",") { row.push(field); field = ""; }
        else if (char === "\n" || char === "\r") {
            if (char === "\r" && text[i + 1] === "\n") i += 1;
            row.push(field); rows.push(row); row = []; field = "";
            if (rows.length > MAX_ROWS) break;
        } else field += char;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
}

function formatCell(value: Cell) {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
}

/** Excel (.xlsx) and CSV as scrollable tables, one tab per sheet. */
export default function SheetView({ data, csv, onError }: { data: Uint8Array; csv: boolean; onError: (error: Error) => void }) {
    const [sheets, setSheets] = useState<Sheet[] | null>(null);
    const [active, setActive] = useState(0);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (csv) {
                const { rows, truncated } = limit(parseCsv(new TextDecoder().decode(data)));
                return [{ name: "Sheet 1", rows, truncated }];
            }
            const { default: readXlsxFile, readSheetNames } = await import("read-excel-file");
            const buffer = data.slice().buffer;
            const names = await readSheetNames(buffer);
            const result: Sheet[] = [];
            for (const name of names) {
                const raw = (await readXlsxFile(buffer, { sheet: name })) as Cell[][];
                result.push({ name, ...limit(raw) });
            }
            return result;
        })()
            .then((result) => {
                if (!cancelled) setSheets(result);
            })
            .catch((error: unknown) => {
                if (!cancelled) onError(error instanceof Error ? error : new Error("This spreadsheet could not be displayed."));
            });

        return () => {
            cancelled = true;
        };
    }, [csv, data, onError]);

    if (!sheets) {
        return <p className="py-10 text-center text-sm font-semibold text-subtle">Opening spreadsheet...</p>;
    }

    const sheet = sheets[Math.min(active, sheets.length - 1)];

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-card">
            {sheets.length > 1 && (
                <div role="tablist" aria-label="Sheets" className="flex shrink-0 gap-2 overflow-x-auto border-b border-line px-3 py-2">
                    {sheets.map((item, index) => (
                        <button
                            key={item.name}
                            type="button"
                            role="tab"
                            aria-selected={index === active}
                            onClick={() => setActive(index)}
                            className={`app-chip whitespace-nowrap ${index === active ? "app-chip-active" : ""}`}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            )}
            <div className="min-h-0 flex-1 overflow-auto" style={{ scrollBehavior: "auto" }}>
                {sheet.rows.length === 0 ? (
                    <p className="py-10 text-center text-sm text-subtle">This sheet is empty.</p>
                ) : (
                    <table className="min-w-full border-collapse text-left text-xs text-ink">
                        <tbody>
                            {sheet.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex === 0 ? "bg-mist font-bold" : "odd:bg-card even:bg-mist/60"}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} className="max-w-[16rem] border border-line px-2.5 py-1.5 align-top [overflow-wrap:anywhere]">
                                            {formatCell(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {sheet.truncated && (
                    <p className="px-3 py-3 text-xs font-semibold text-subtle">
                        Showing the first {MAX_ROWS} rows and {MAX_COLUMNS} columns. Download the file to see everything.
                    </p>
                )}
            </div>
        </div>
    );
}
