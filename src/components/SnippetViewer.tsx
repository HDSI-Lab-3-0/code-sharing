import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import * as Diff from "diff";
import { formatDistanceToNow } from "date-fns";
import { api } from "../../convex/_generated/api";
import { detectLanguage, highlightHtml } from "../lib/highlighter";
import { withBasePath } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardBody, CardHeader } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

function trimEmptyEdgeLines(value: string) {
    const lines = value.split("\n");
    while (lines.length && lines[0].trim() === "") lines.shift();
    while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
    return lines.join("\n");
}

function CodeDisplay({
    code,
    language: initialLanguage,
    compareCode,
    viewMode,
}: {
    code: string;
    language: string;
    compareCode?: string;
    viewMode: "code" | "diff";
}) {
    const normalizedCode = trimEmptyEdgeLines(code || "");
    const normalizedCompareCode = typeof compareCode === "string" ? trimEmptyEdgeLines(compareCode) : undefined;

    const detectedLanguage = useMemo(() => {
        if (!initialLanguage || initialLanguage === "auto") {
            return detectLanguage(normalizedCode) || "plaintext";
        }
        return initialLanguage;
    }, [initialLanguage, normalizedCode]);

    const lines = normalizedCode.split("\n");

    if (viewMode === "code" || !normalizedCompareCode) {
        return (
            <div className="flex min-h-0 flex-1 overflow-auto bg-white font-mono text-xs leading-relaxed">
                <div className="min-w-12 shrink-0 select-none border-r border-[#c5c6ce]/50 bg-[#edeef1] px-2 text-right text-slate-400">
                    {lines.map((_, i) => (
                        <div key={i} className="flex min-h-[1.35em] items-center justify-end">
                            <span className="px-1">{i + 1}</span>
                        </div>
                    ))}
                </div>
                <div className="flex-1 overflow-auto">
                    {lines.map((line, i) => {
                        const { html } = highlightHtml(line, detectedLanguage);
                        return (
                            <div key={i} className="flex min-h-[1.35em] w-full items-center px-2 leading-relaxed whitespace-pre">
                                <span className="w-full" dangerouslySetInnerHTML={{ __html: html || " " }} />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const oldLines = normalizedCompareCode.split("\n");
    const newLines = normalizedCode.split("\n");
    const diff = Diff.diffArrays(oldLines, newLines);
    let oldLineCounter = 1;
    let newLineCounter = 1;
    const rows: Array<{
        type: "context" | "added" | "removed";
        content: string;
        oldLine: number | null;
        newLine: number | null;
        marker: " " | "+" | "-";
    }> = [];

    diff.forEach((part) => {
        if (!part.value) return;
        part.value.forEach((line) => {
            const { html } = highlightHtml(line, detectedLanguage);
            if (part.added) {
                rows.push({
                    type: "added",
                    content: html,
                    oldLine: null,
                    newLine: newLineCounter++,
                    marker: "+",
                });
                return;
            }

            if (part.removed) {
                rows.push({
                    type: "removed",
                    content: html,
                    oldLine: oldLineCounter++,
                    newLine: null,
                    marker: "-",
                });
                return;
            }

            rows.push({
                type: "context",
                content: html,
                oldLine: oldLineCounter++,
                newLine: newLineCounter++,
                marker: " ",
            });
        });
    });

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-white font-mono text-xs leading-relaxed">
            {rows.length === 0 ? (
                <div className="flex min-h-[8rem] flex-1 items-center justify-center px-4 text-center text-xs text-[#75777e]">
                    No line-level changes between these versions.
                </div>
            ) : (
                <div className="min-w-full">
                    {rows.map((row, i) => {
                        const classes =
                            row.type === "added"
                                ? "bg-[#e6ffec] text-[#155724]"
                                : row.type === "removed"
                                  ? "bg-[#ffebe9] text-[#cb2431]"
                                  : "bg-white text-[#191c1e]";

                        return (
                            <div key={i} className={`flex min-w-full ${classes}`}>
                                <div className="grid w-[5rem] shrink-0 grid-cols-[3rem_2rem] border-r border-[#c5c6ce]/50 bg-[#edeef1] text-right text-slate-400">
                                    <div className="flex min-h-[1.5em] items-center justify-end px-2">
                                        <span className="px-1">{row.newLine ?? row.oldLine ?? "\u00A0"}</span>
                                    </div>
                                    <div className="flex min-h-[1.5em] items-center justify-center border-l border-[#c5c6ce]/40 px-1 text-center font-semibold">
                                        {row.marker}
                                    </div>
                                </div>
                                <div className="flex min-h-[1.5em] flex-1 items-center px-4 whitespace-pre">
                                    <span className="w-full" dangerouslySetInnerHTML={{ __html: row.content || " " }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ConsoleSection({
    feedbackList,
    onSubmitFeedback,
    isSubmitting,
    statusMessage,
}: {
    feedbackList: Array<{ _id: string; content: string; createdAt: number }>;
    onSubmitFeedback: (content: string) => Promise<void>;
    isSubmitting: boolean;
    statusMessage: string;
}) {
    const [inputContent, setInputContent] = useState("");

    const handleSubmit = async () => {
        if (!inputContent.trim() || isSubmitting) return;
        const payload = inputContent;
        setInputContent("");
        try {
            await onSubmitFeedback(payload);
        } catch {
            setInputContent(payload);
        }
    };

    return (
        <Card className="ambient-shadow flex h-full min-h-0 flex-col overflow-hidden rounded-xl border-none bg-white">
            <CardHeader className="flex shrink-0 items-center border-b border-[#c5c6ce]/40 bg-[#e7e8eb] px-3 py-2">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-[#ba1a1a]/40" />
                        <div className="h-3 w-3 rounded-full bg-[#735c00]/40" />
                        <div className="h-3 w-3 rounded-full bg-[#4d5f80]/40" />
                    </div>
                    <span className="font-label text-[10px] font-bold tracking-widest text-slate-500 uppercase">console.log</span>
                </div>
            </CardHeader>
            <CardBody className="flex min-h-0 flex-1 flex-col p-0">
                <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-white px-3 py-2 font-mono text-[11px]">
                    {feedbackList.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#c5c6ce] px-4 py-3 text-center text-slate-500">
                            No logs yet for this version.
                        </div>
                    )}
                    {feedbackList.map((fb) => (
                        <div key={fb._id} className="rounded-xl border border-[#c5c6ce]/40 bg-[#f8f9fc] px-4 py-2 text-[#191c1e]">
                            <div className="mb-1 text-[10px] tracking-wide text-slate-500 uppercase">
                                {new Date(fb.createdAt).toLocaleTimeString([], { hour12: false })}
                            </div>
                            <div className="whitespace-pre-wrap break-all">{fb.content}</div>
                        </div>
                    ))}
                </div>
                <div className="shrink-0 border-t border-[#c5c6ce]/40 bg-[#edeef1] px-3 py-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <Textarea
                            placeholder="Paste runtime output, errors, or notes..."
                            value={inputContent}
                            onChange={(e) => setInputContent(e.target.value)}
                            rows={2}
                            className="min-h-0 border-[#c5c6ce] bg-white font-mono text-xs"
                        />
                        <Button type="button" className="h-8 shrink-0 rounded-lg bg-[#011633] px-3 text-xs text-white" onClick={handleSubmit} isLoading={isSubmitting}>
                            Add Log
                        </Button>
                    </div>
                    {statusMessage ? <p className="mt-1 text-[10px] text-[#44474e]">{statusMessage}</p> : null}
                </div>
            </CardBody>
        </Card>
    );
}

export default function SnippetViewer({ publicId }: { publicId: string }) {
    const homeHref = withBasePath("");
    const data = useQuery(api.snippets.getSnippet, { publicId });
    const addFeedback = useMutation(api.snippets.addFeedback);
    const createVersion = useMutation(api.snippets.createVersion);
    const verifyPassword = useAction(api.auth.verifyPassword);

    const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
    const [compareVersion, setCompareVersion] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"code" | "diff">("code");
    const [activeTab, setActiveTab] = useState("code");

    const [adminPassword, setAdminPassword] = useState("");
    const [tempPassword, setTempPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishMessage, setPublishMessage] = useState("");
    const [consoleMessage, setConsoleMessage] = useState("");
    const [isAddingLog, setIsAddingLog] = useState(false);

    useEffect(() => {
        if (data && selectedVersion === null) {
            setSelectedVersion(data.snippet.latestVersion);
        }
    }, [data, selectedVersion]);

    const currentVersionData = useMemo(() => {
        if (!data || selectedVersion === null) return null;
        return data.versions.find((v) => v.version === selectedVersion) ?? null;
    }, [data, selectedVersion]);

    const availableCompareVersions = useMemo(() => {
        if (!data || selectedVersion === null) return [];
        return data.versions.filter((v) => v.version !== selectedVersion);
    }, [data, selectedVersion]);

    useEffect(() => {
        if (viewMode !== "diff") return;
        if (availableCompareVersions.length === 0) {
            setCompareVersion(null);
            return;
        }
        const stillValid = availableCompareVersions.some((v) => v.version === compareVersion);
        if (stillValid) return;
        const nearestLower = availableCompareVersions
            .filter((v) => selectedVersion !== null && v.version < selectedVersion)
            .sort((a, b) => b.version - a.version)[0];
        setCompareVersion(nearestLower?.version ?? availableCompareVersions[availableCompareVersions.length - 1].version);
    }, [availableCompareVersions, compareVersion, selectedVersion, viewMode]);

    const compareVersionData = useMemo(() => {
        if (!data || compareVersion === null) return null;
        return data.versions.find((v) => v.version === compareVersion) ?? null;
    }, [compareVersion, data]);

    const orderedDiffPair = useMemo(() => {
        if (!currentVersionData || !compareVersionData) return null;
        if (currentVersionData.version === compareVersionData.version) return null;
        return currentVersionData.version > compareVersionData.version
            ? { from: compareVersionData, to: currentVersionData }
            : { from: currentVersionData, to: compareVersionData };
    }, [compareVersionData, currentVersionData]);

    const feedbackList = useQuery(api.snippets.getFeedback, currentVersionData ? { snippetVersionId: currentVersionData._id } : "skip");

    const safeFeedback = feedbackList ?? [];

    if (data === undefined) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#011633]" />
            </div>
        );
    }

    if (data === null) {
        return <div className="flex h-full min-h-0 items-center justify-center text-sm text-[#ba1a1a]">Snippet not found.</div>;
    }

    if (!currentVersionData) {
        return <div className="flex h-full min-h-0 items-center justify-center text-sm text-[#44474e]">No version available.</div>;
    }

    const submitFeedback = async (content: string) => {
        setConsoleMessage("");
        setIsAddingLog(true);
        try {
            await addFeedback({ snippetVersionId: currentVersionData._id, content });
            setConsoleMessage("Log added.");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to add log.";
            setConsoleMessage(message);
            throw error;
        } finally {
            setIsAddingLog(false);
        }
    };

    const handleStartEdit = () => {
        setPublishMessage("");
        if (isEditing) {
            setIsEditing(false);
            setAdminPassword("");
            setNewCode("");
            return;
        }
        setTempPassword("");
        setPasswordError("");
        setIsPasswordModalOpen(true);
    };

    const handlePasswordSubmit = async () => {
        const password = tempPassword.trim();
        if (!password) return;

        setIsVerifyingPassword(true);
        setPasswordError("");
        try {
            await verifyPassword({ password });
            setAdminPassword(password);
            setIsPasswordModalOpen(false);
            setIsEditing(true);
            setNewCode(currentVersionData.code);
            setTempPassword("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Invalid password";
            setPasswordError(message);
        } finally {
            setIsVerifyingPassword(false);
        }
    };

    const handleNewVersion = async () => {
        if (!newCode.trim() || !adminPassword) return;
        setPublishMessage("");
        setIsPublishing(true);
        try {
            const nextVersion = await createVersion({
                publicId,
                code: newCode,
                language: detectLanguage(newCode) ?? "plaintext",
                password: adminPassword,
            });
            setIsEditing(false);
            setAdminPassword("");
            setNewCode("");
            setSelectedVersion(nextVersion);
            setViewMode("code");
            setPublishMessage(`Version ${nextVersion} published.`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to publish version.";
            setPublishMessage(message);
        } finally {
            setIsPublishing(false);
        }
    };

    const disableDiff = availableCompareVersions.length === 0;

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8f9fc] text-[#191c1e]">
            <header className="z-50 shrink-0 border-b border-[#182B49]/10 bg-slate-50/40 shadow-sm backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-2">
                    <span className="font-headline text-lg font-black tracking-tighter text-[#182B49]">HDSI Code Curator</span>
                    <Badge className="bg-[#fecc00] px-2 py-0 text-[10px] text-[#6e5700]">View Snippet</Badge>
                </div>
            </header>

            <div className="flex min-h-0 flex-1 overflow-hidden">
                <aside className="hidden min-h-0 w-56 shrink-0 flex-col space-y-4 border-r border-[#182B49]/5 bg-slate-50 p-3 font-label lg:flex">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 px-2 py-1">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#182b49] text-[#fecc00]">
                                <span className="text-xs font-bold">H</span>
                            </div>
                            <div>
                                <h3 className="font-headline text-sm font-bold leading-tight text-[#182B49]">Research Workspace</h3>
                                <p className="text-[9px] tracking-tighter text-slate-500 uppercase">Halicioglu Data Science Institute</p>
                            </div>
                        </div>
                    </div>
                    <nav className="min-h-0 flex-1 space-y-1">
                        <a className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[#44474e]" href={homeHref}>
                            <span className="font-semibold">Create Snippet</span>
                        </a>
                        <a className="translate-x-0.5 flex items-center gap-2 rounded-lg bg-[#011633] px-3 py-2 text-white shadow-md" href="#">
                            <span className="text-xs font-semibold">View Snippet</span>
                        </a>
                    </nav>
                </aside>

                <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f2f3f6] p-3">
                    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 overflow-hidden">
                        <div className="flex shrink-0 flex-col justify-between gap-2 md:flex-row md:items-center">
                            <div>
                                <div className="mb-0.5 flex flex-wrap items-center gap-2">
                                    <h1 className="font-headline text-xl font-black tracking-tight text-[#011633]">Snippet #{publicId}</h1>
                                    <Badge className="bg-[#e1e2e5] px-2 py-0 text-[10px] text-[#44474e]">{currentVersionData.language}</Badge>
                                </div>
                                <p className="text-xs text-[#44474e]">
                                    Version {currentVersionData.version} updated {formatDistanceToNow(currentVersionData._creationTime)} ago
                                </p>
                            </div>
                            <Button type="button" className="h-8 shrink-0 rounded-lg bg-[#011633] px-3 text-xs text-white" onClick={handleStartEdit}>
                                {isEditing ? "Cancel New Version" : "Add New Version"}
                            </Button>
                        </div>

                        {isEditing ? (
                            <Card className="ambient-shadow flex max-h-[min(38vh,260px)] min-h-0 shrink-0 flex-col overflow-hidden rounded-lg border-none bg-white p-0">
                                <CardHeader className="flex shrink-0 items-center justify-between border-b border-[#c5c6ce]/30 bg-[#e7e8eb] px-3 py-2">
                                    <span className="font-label text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                                        Drafting Version {currentVersionData.version + 1}
                                    </span>
                                    <span className="text-[10px] text-slate-500">Authorized session</span>
                                </CardHeader>
                                <CardBody className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
                                    <Textarea
                                        value={newCode}
                                        onChange={(e) => setNewCode(e.target.value)}
                                        className="min-h-0 flex-1 resize-none overflow-y-auto border-[#c5c6ce] bg-white font-mono text-xs text-[#011633]"
                                    />
                                    <div className="flex shrink-0 items-center justify-end gap-2">
                                        <Button type="button" variant="outline" className="h-8 border-[#c5c6ce] px-3 text-xs" onClick={handleStartEdit}>
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            className="h-8 bg-[#011633] px-3 text-xs text-white"
                                            onClick={handleNewVersion}
                                            isLoading={isPublishing}
                                            disabled={!newCode.trim()}
                                        >
                                            Publish Version
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        ) : null}

                        {publishMessage ? (
                            <div className="shrink-0 rounded-lg border border-[#c5c6ce]/50 bg-white px-3 py-2 text-xs text-[#44474e]">{publishMessage}</div>
                        ) : null}

                        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                            <DialogContent className="border-[#c5c6ce] bg-white">
                                <DialogHeader>
                                    <DialogTitle>Admin Access Required</DialogTitle>
                                    <DialogDescription>Enter the admin password to publish a new snippet version.</DialogDescription>
                                </DialogHeader>
                                <Input
                                    placeholder="Enter admin password"
                                    type="password"
                                    value={tempPassword}
                                    onChange={(e) => {
                                        setTempPassword(e.target.value);
                                        if (passwordError) setPasswordError("");
                                    }}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") void handlePasswordSubmit();
                                    }}
                                />
                                {passwordError ? <p className="text-xs text-[#93000a]">{passwordError}</p> : null}
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        className="bg-[#011633] text-white"
                                        onClick={() => void handlePasswordSubmit()}
                                        isLoading={isVerifyingPassword}
                                        disabled={!tempPassword.trim()}
                                    >
                                        Verify
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
                            <TabsList className="h-9 w-full shrink-0 justify-start gap-4 rounded-none border-b border-[#c5c6ce]/40 bg-transparent p-0">
                                <TabsTrigger
                                    value="code"
                                    className="h-9 rounded-none border-b-2 border-transparent px-0 pb-0 text-xs text-[#75777e] data-[state=active]:border-[#011633] data-[state=active]:bg-transparent data-[state=active]:text-[#011633]"
                                >
                                    Code
                                </TabsTrigger>
                                <TabsTrigger
                                    value="console"
                                    className="h-9 rounded-none border-b-2 border-transparent px-0 pb-0 text-xs text-[#75777e] data-[state=active]:border-[#011633] data-[state=active]:bg-transparent data-[state=active]:text-[#011633]"
                                >
                                    Console
                                    {safeFeedback.length > 0 ? <Badge className="ml-1 bg-[#e1e2e5] px-1.5 py-0 text-[10px] text-[#44474e]">{safeFeedback.length}</Badge> : null}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="code" className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
                                <Card className="ambient-shadow flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-none bg-[#e1e2e5]">
                                    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#c5c6ce]/40 bg-[#e7e8eb] px-3 py-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex items-center rounded-lg border border-[#c5c6ce] bg-white p-1">
                                                <button
                                                    type="button"
                                                    className={`rounded-md px-3 py-1 text-xs font-semibold ${viewMode === "code" ? "bg-[#011633] text-white" : "text-[#44474e]"}`}
                                                    onClick={() => setViewMode("code")}
                                                >
                                                    Code
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={disableDiff}
                                                    className={`rounded-md px-3 py-1 text-xs font-semibold ${viewMode === "diff" ? "bg-[#011633] text-white" : "text-[#44474e]"
                                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                                    onClick={() => setViewMode("diff")}
                                                >
                                                    Diff
                                                </button>
                                            </div>

                                            <Select
                                                className="h-9 border-[#c5c6ce] bg-white text-xs"
                                                value={selectedVersion?.toString() ?? ""}
                                                onChange={(e) => setSelectedVersion(Number(e.target.value))}
                                            >
                                                {data.versions.map((v) => (
                                                    <option key={v._id} value={v.version}>
                                                        Version {v.version}
                                                    </option>
                                                ))}
                                            </Select>

                                            {viewMode === "diff" ? (
                                                <>
                                                    <span className="px-1 text-xs text-[#75777e]">vs</span>
                                                    <Select
                                                        className="h-9 border-[#c5c6ce] bg-white text-xs"
                                                        value={compareVersion?.toString() ?? ""}
                                                        onChange={(e) => setCompareVersion(Number(e.target.value))}
                                                    >
                                                        {availableCompareVersions.map((v) => (
                                                            <option key={v._id} value={v.version}>
                                                                Version {v.version}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                    {orderedDiffPair ? (
                                                        <span className="ml-1 text-[11px] text-[#75777e]">
                                                            v{orderedDiffPair.from.version} → v{orderedDiffPair.to.version}
                                                        </span>
                                                    ) : null}
                                                </>
                                            ) : null}
                                        </div>
                                    </div>

                                    {viewMode === "diff" && !compareVersionData ? (
                                        <div className="flex min-h-0 flex-1 items-center justify-center bg-white px-4 py-6 text-center text-xs text-[#75777e]">
                                            Select another version to compare.
                                        </div>
                                    ) : (
                                        <CodeDisplay
                                            code={viewMode === "diff" && orderedDiffPair ? orderedDiffPair.to.code : currentVersionData.code}
                                            language={currentVersionData.language}
                                            compareCode={viewMode === "diff" ? orderedDiffPair?.from.code : compareVersionData?.code}
                                            viewMode={viewMode}
                                        />
                                    )}
                                </Card>
                            </TabsContent>

                            <TabsContent value="console" className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
                                <ConsoleSection feedbackList={safeFeedback} onSubmitFeedback={submitFeedback} isSubmitting={isAddingLog} statusMessage={consoleMessage} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
}
