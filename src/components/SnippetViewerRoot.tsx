import { useMemo } from "react";
import SnippetViewer from "./SnippetViewer";
import Provider from "./Provider";

export default function SnippetViewerRoot({ publicId = "" }: { publicId?: string }) {
    const resolvedPublicId = useMemo(() => {
        if (publicId) return publicId;
        if (typeof window === "undefined") return "";
        return new URLSearchParams(window.location.search).get("id")?.trim() ?? "";
    }, [publicId]);

    if (!resolvedPublicId) {
        return (
            <Provider>
                <div className="flex min-h-screen items-center justify-center px-6 text-center text-[#44474e]">
                    Missing snippet id.
                </div>
            </Provider>
        );
    }

    return (
        <Provider>
            <SnippetViewer publicId={resolvedPublicId} />
        </Provider>
    );
}
