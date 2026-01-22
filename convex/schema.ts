import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    snippets: defineTable({
        publicId: v.string(), // Unique URL slug
        latestVersion: v.number(), // Current version count
    }).index("by_publicId", ["publicId"]),

    snippetVersions: defineTable({
        snippetId: v.id("snippets"),
        version: v.number(),
        code: v.string(),
        language: v.string(),
        diff: v.optional(v.string()), // Store diff from previous version if needed, or compute on client
    })
        .index("by_snippetId", ["snippetId"])
        .index("by_snippetId_version", ["snippetId", "version"]),

    feedback: defineTable({
        snippetVersionId: v.id("snippetVersions"),
        content: v.string(), // Console output/results
        createdAt: v.number(),
    }).index("by_snippetVersionId", ["snippetVersionId"]),
});
