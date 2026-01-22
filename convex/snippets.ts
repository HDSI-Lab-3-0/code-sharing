import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateAccess } from "./auth";

// Create a new snippet (requires password)
export const createSnippet = mutation({
    args: {
        code: v.string(),
        language: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        validateAccess(args.password);

        // Generate a simple random slug
        const publicId = Math.random().toString(36).substring(2, 10);

        const snippetId = await ctx.db.insert("snippets", {
            publicId,
            latestVersion: 1,
        });

        await ctx.db.insert("snippetVersions", {
            snippetId,
            version: 1,
            code: args.code,
            language: args.language,
        });

        return publicId;
    },
});

// Create a new version for an existing snippet (requires password)
export const createVersion = mutation({
    args: {
        publicId: v.string(),
        code: v.string(),
        language: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        validateAccess(args.password);

        const snippet = await ctx.db
            .query("snippets")
            .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
            .first();

        if (!snippet) {
            throw new Error("Snippet not found");
        }

        const newVersion = snippet.latestVersion + 1;

        await ctx.db.insert("snippetVersions", {
            snippetId: snippet._id,
            version: newVersion,
            code: args.code,
            language: args.language,
        });

        await ctx.db.patch(snippet._id, {
            latestVersion: newVersion,
        });

        return newVersion;
    },
});

// Get snippet data by publicId
export const getSnippet = query({
    args: { publicId: v.string() },
    handler: async (ctx, args) => {
        const snippet = await ctx.db
            .query("snippets")
            .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
            .first();

        if (!snippet) {
            return null;
        }

        // Fetch all versions
        const versions = await ctx.db
            .query("snippetVersions")
            .withIndex("by_snippetId", (q) => q.eq("snippetId", snippet._id))
            .collect();

        // Sort versions by version number
        versions.sort((a, b) => a.version - b.version);

        return {
            snippet,
            versions,
        };
    },
});

// Add feedback to a specific version (Public access)
export const addFeedback = mutation({
    args: {
        snippetVersionId: v.id("snippetVersions"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("feedback", {
            snippetVersionId: args.snippetVersionId,
            content: args.content,
            createdAt: Date.now(),
        });
    },
});

// Get feedback for a specific version
export const getFeedback = query({
    args: { snippetVersionId: v.id("snippetVersions") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("feedback")
            .withIndex("by_snippetVersionId", (q) => q.eq("snippetVersionId", args.snippetVersionId))
            .order("desc")
            .collect();
    },
});
