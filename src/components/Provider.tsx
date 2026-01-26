import { HeroUIProvider } from "@heroui/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useEffect, useState, type ReactNode } from "react";

export default function Provider({ children }: { children: ReactNode }) {
    const [convex] = useState(() => new ConvexReactClient(import.meta.env.PUBLIC_CONVEX_URL as string));

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

    return (
        <ConvexProvider client={convex}>
            <HeroUIProvider>
                <div className="light" data-theme="light">
                    {children}
                </div>
            </HeroUIProvider>
        </ConvexProvider>
    );
}
