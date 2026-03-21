import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
    return (
        <div className="relative">
            <select
                ref={ref}
                className={cn(
                    "flex h-10 w-full appearance-none rounded-lg border border-[#c5c6ce] bg-white px-3 py-2 pr-8 text-sm text-[#191c1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#011633]/10",
                    className
                )}
                {...props}
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#75777e]" />
        </div>
    );
});
Select.displayName = "Select";

export { Select };
