import { renderAsync } from "docx-preview";
import { useEffect, useRef, useState } from "react";
import { openExternalLink } from "../../utils/links";

/** Word (.docx) rendered as HTML in the app. Content reflows to the phone width instead of A4 pages. */
export default function DocxView({ data, onError }: { data: Uint8Array; onError: (error: Error) => void }) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const styleRef = useRef<HTMLDivElement>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
        const body = bodyRef.current;
        const styles = styleRef.current;
        if (!body || !styles) return;
        let cancelled = false;

        renderAsync(data.slice().buffer, body, styles, {
            inWrapper: false,
            ignoreWidth: true,
            ignoreHeight: true,
            breakPages: false,
            renderComments: false,
            renderChanges: false,
            useBase64URL: true,
        })
            .then(() => {
                if (cancelled) return;
                // Documents come from uploads: only allow web links, and open them outside the Mini App.
                body.querySelectorAll("a[href]").forEach((link) => {
                    const href = link.getAttribute("href") ?? "";
                    if (/^https?:\/\//i.test(href)) {
                        link.addEventListener("click", (event) => {
                            event.preventDefault();
                            openExternalLink(href);
                        });
                    } else if (!href.startsWith("#")) {
                        link.removeAttribute("href");
                    }
                });
                setRendered(true);
            })
            .catch((error: unknown) => {
                if (!cancelled) onError(error instanceof Error ? error : new Error("This Word document could not be displayed."));
            });

        return () => {
            cancelled = true;
            body.replaceChildren();
            styles.replaceChildren();
        };
    }, [data, onError]);

    return (
        <div className="min-h-0 flex-1 overflow-auto bg-[#E4EAE7] p-3" style={{ scrollBehavior: "auto" }}>
            <div ref={styleRef} />
            {!rendered && <p className="py-10 text-center text-sm font-semibold text-subtle">Opening document...</p>}
            <div
                ref={bodyRef}
                className="docx-view mx-auto max-w-3xl overflow-hidden rounded-[6px] bg-white p-5 text-ink shadow-[0_2px_10px_rgba(23,43,47,0.12)] [overflow-wrap:anywhere] [&_img]:h-auto [&_img]:max-w-full [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
            />
        </div>
    );
}
