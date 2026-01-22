import { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";

export function validateAccess(password: string) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
        throw new Error("ADMIN_PASSWORD environment variable is not set");
    }
    if (password !== adminPassword) {
        throw new Error("Invalid password");
    }
}
