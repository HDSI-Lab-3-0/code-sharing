import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-10 w-full rounded-lg border border-[#c5c6ce] bg-white px-3 py-2 text-sm text-[#191c1e] placeholder:text-[#75777e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#011633]/10",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Input.displayName = "Input";

export { Input };
