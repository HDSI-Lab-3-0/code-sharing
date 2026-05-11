import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useEffect, useState, type ReactNode } from "react";

export default function Provider({ children }: { children: ReactNode }) {
    const convexUrl = import.meta.env.PUBLIC_CONVEX_URL;
    const [convex] = useState(() => {
        if (!convexUrl) return null;
        return new ConvexReactClient(convexUrl);
    });

    // Enforce light mode
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("dark");
        root.classList.add("light");
        root.setAttribute("data-theme", "light");

        // Prevent dark mode from being added
        const observer = new MutationObserver(() => {
            if (root.classList.contains("dark")) {
                root.classList.remove("dark");
                root.classList.add("light");
            }
            if (root.getAttribute("data-theme") !== "light") {
                root.setAttribute("data-theme", "light");
            }
        });

        observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });

        return () => observer.disconnect();
    }, []);

    if (!convex) {
        return (
            <div className="light h-full min-h-0 p-6" data-theme="light">
                <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
                    Missing `PUBLIC_CONVEX_URL` at build time. Add it to your deployment environment and rebuild.
                </div>
            </div>
        );
    }

    return (
        <ConvexProvider client={convex}>
            <div className="light h-full min-h-0" data-theme="light">{children}</div>
        </ConvexProvider>
    );
}
