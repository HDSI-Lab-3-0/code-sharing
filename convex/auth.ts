import { action } from "./_generated/server";
import { v } from "convex/values";

export function validateAccess(password: string) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
        throw new Error("ADMIN_PASSWORD environment variable is not set");
    }
    if (password !== adminPassword) {
        throw new Error("Invalid password");
    }
}

export const verifyPassword = action({
    args: { password: v.string() },
    handler: async (_ctx, args) => {
        validateAccess(args.password);
        return { success: true };
    },
});
