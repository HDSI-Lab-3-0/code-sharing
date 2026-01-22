import { HeroUIProvider } from "@heroui/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useState, type ReactNode } from "react";

export default function Provider({ children }: { children: ReactNode }) {
    const [convex] = useState(() => new ConvexReactClient(import.meta.env.PUBLIC_CONVEX_URL as string));

    return (
        <ConvexProvider client={convex}>
            <HeroUIProvider>
                {children}
            </HeroUIProvider>
        </ConvexProvider>
    );
}
