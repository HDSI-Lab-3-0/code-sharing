import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                "flex min-h-20 w-full rounded-lg border border-[#c5c6ce] bg-white px-3 py-2 text-sm text-[#191c1e] placeholder:text-[#75777e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#011633]/10",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Textarea.displayName = "Textarea";

export { Textarea };
