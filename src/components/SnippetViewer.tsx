import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Textarea, Card, CardBody, CardHeader, Select, SelectItem, Chip } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import * as Diff from 'diff';
import Provider from "./Provider";

// --- Sub-components ---

function ConsoleSection({ feedbackList, onSubmitFeedback, isLoading }: { feedbackList: any[], onSubmitFeedback: (content: string) => void, isLoading: boolean }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [inputContent, setInputContent] = useState("");
    const [copyStatus, setCopyStatus] = useState("Copy");

    const handleCopy = () => {
        const text = feedbackList.map(item => `[${new Date(item.createdAt).toISOString()}] ${item.content}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopyStatus("Copied!");
        setTimeout(() => setCopyStatus("Copy"), 2000);
    };

    const handleSubmit = () => {
        if (!inputContent.trim()) return;
        onSubmitFeedback(inputContent);
        setInputContent("");
    };

    return (
        <Card className="border border-[var(--color-surface-200)] shadow-sm">
            <CardHeader className="flex justify-between items-center py-3 bg-[var(--color-surface-100)] border-b border-[var(--color-surface-200)]">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--color-text-secondary)] font-mono uppercase tracking-wider">Console / Log</span>
                    <Chip size="sm" variant="flat" className="bg-[var(--color-surface-200)] text-[var(--color-text-tertiary)] border-0 text-xs h-6">{feedbackList?.length || 0}</Chip>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="light" onPress={handleCopy} className="text-xs h-8 text-[var(--color-text-secondary)] font-medium">
                        {copyStatus}
                    </Button>
                    <Button size="sm" variant="light" onPress={() => setIsCollapsed(!isCollapsed)} className="text-xs h-8 text-[var(--color-text-secondary)] font-medium">
                        {isCollapsed ? "Expand" : "Collapse"}
                    </Button>
                </div>
            </CardHeader>
            {!isCollapsed && (
                <CardBody className="p-0 flex flex-col">
                    <div className="max-h-[300px] overflow-y-auto bg-[var(--color-surface-50)] p-2 font-mono text-xs">
                        {feedbackList?.map((fb) => (
                            <div key={fb._id} className="mb-1 p-2 hover:bg-[var(--color-surface-100)] rounded flex gap-3 group">
                                <span className="text-[var(--color-text-tertiary)] select-none whitespace-nowrap">
                                    {new Date(fb.createdAt).toLocaleTimeString([], { hour12: false })}
                                </span>
                                <span className="text-[var(--color-text-primary)] whitespace-pre-wrap break-all">{fb.content}</span>
                            </div>
                        ))}
                        {feedbackList?.length === 0 && (
                            <div className="p-4 text-[var(--color-text-tertiary)] italic text-center">No logs available.</div>
                        )}
                    </div>
                    <div className="p-3 border-t border-[var(--color-surface-200)] bg-[var(--color-surface-50)]">
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="> Enter log or feedback..."
                                value={inputContent}
                                onValueChange={setInputContent}
                                minRows={1}
                                maxRows={4}
                                className="font-mono text-sm"
                                classNames={{
                                    input: "bg-transparent",
                                    inputWrapper: "bg-white border-[var(--color-surface-200)] shadow-none hover:border-[var(--color-accent-primary)] focus-within:border-[var(--color-accent-primary)]"
                                }}
                            />
                            <Button
                                size="sm"
                                color="primary"
                                className="h-auto px-4 bg-[var(--color-accent-primary)] font-medium"
                                onPress={handleSubmit}
                                isLoading={isLoading}
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                </CardBody>
            )}
        </Card>
    );
}

function CodeDisplay({ code, language, compareCode, viewMode }: { code: string, language: string, compareCode?: string, viewMode: 'code' | 'diff' }) {
    if (viewMode === 'code' || !compareCode) {
        return (
            <div className="relative group">
                <pre className="p-4 bg-[var(--color-code-bg)] overflow-x-auto text-sm font-mono text-[var(--color-text-primary)] leading-relaxed min-h-[500px]">
                    <code className={`language-${language}`}>{code}</code>
                </pre>
            </div>
        );
    }

    const diff = Diff.diffLines(compareCode, code);

    return (
        <div className="bg-[var(--color-code-bg)] overflow-x-auto font-mono text-sm leading-relaxed min-h-[500px]">
            {diff.map((part, index) => {
                let bgColor = 'bg-transparent';
                let textColor = 'text-[var(--color-text-primary)]';
                let prefix = '  ';

                if (part.added) {
                    bgColor = 'bg-[#e6ffec]'; // Light green
                    textColor = 'text-[#155724]'; // Dark green
                    prefix = '+ ';
                } else if (part.removed) {
                    bgColor = 'bg-[#ffebe9]'; // Light red
                    textColor = 'text-[#cb2431]'; // Dark red
                    prefix = '- ';
                }

                return (
                    <div key={index} className={`${bgColor} ${textColor} px-4 py-0.5 whitespace-pre-wrap flex w-full`}>
                        <span className="w-6 select-none opacity-40 block flex-shrink-0 text-right mr-3">{prefix}</span>
                        <span>{part.value}</span>
                    </div>
                );
            })}
        </div>
    );
}

// --- Main Component ---

export default function SnippetViewer({ publicId }: { publicId: string }) {
    const data = useQuery(api.snippets.getSnippet, { publicId });
    const addFeedback = useMutation(api.snippets.addFeedback);
    const createVersion = useMutation(api.snippets.createVersion);

    const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
    const [compareVersion, setCompareVersion] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'code' | 'diff'>('code');
    const [adminPassword, setAdminPassword] = useState("");
    const [newCode, setNewCode] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Initialize version
    useEffect(() => {
        if (data && selectedVersion === null) {
            setSelectedVersion(data.snippet.latestVersion);
        }
    }, [data]);

    // Derived state
    const currentVersionData = useMemo(() =>
        data?.versions.find(v => v.version === selectedVersion) || null,
        [data, selectedVersion]);

    const compareVersionData = useMemo(() =>
        data?.versions.find(v => v.version === compareVersion) || null,
        [data, compareVersion]);

    // Auto-set compare version to previous component when in diff mode if not set
    useEffect(() => {
        if (viewMode === 'diff' && compareVersion === null && currentVersionData) {
            const prev = currentVersionData.version > 1 ? currentVersionData.version - 1 : currentVersionData.version;
            setCompareVersion(prev);
        }
    }, [viewMode, currentVersionData]);

    const feedbackList = useQuery(api.snippets.getFeedback, currentVersionData ? { snippetVersionId: currentVersionData._id } : "skip");

    if (data === undefined) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-primary)]"></div></div>;
    if (data === null) return <div className="flex h-screen items-center justify-center text-[var(--color-danger)]">Snippet not found</div>;
    if (!currentVersionData) return null;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(currentVersionData.code);
        setSuccessMsg("Copied!");
        setTimeout(() => setSuccessMsg(""), 2000);
    };

    const submitFeedback = async (content: string) => {
        await addFeedback({
            snippetVersionId: currentVersionData._id,
            content: content
        });
    };

    const handleNewVersion = async () => {
        if (!newCode || !adminPassword) return;
        try {
            await createVersion({
                publicId,
                code: newCode,
                language: currentVersionData.language,
                password: adminPassword
            });
            setIsEditing(false);
            setNewCode("");
            alert("New version published successfully!");
            // Optimistic update or wait for query re-fetch
            setSelectedVersion(currentVersionData.version + 1);
        } catch (e: any) {
            alert("Failed to update: " + e.message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-surface-200)] pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Snippet #{publicId}</h1>
                        <Chip className="bg-[var(--color-surface-200)] text-[var(--color-text-secondary)] font-medium upper-case text-xs" size="sm">{currentVersionData.language}</Chip>
                    </div>
                    <div className="text-[var(--color-text-tertiary)] text-sm">
                        Created {formatDistanceToNow(currentVersionData._creationTime)} ago
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                        onPress={() => { setIsEditing(!isEditing); setNewCode(currentVersionData.code); }}
                        variant="bordered"
                        className="border-[var(--color-surface-200)] text-[var(--color-text-secondary)] font-medium"
                    >
                        {isEditing ? "Cancel Edit" : "Edit / Version (+)"}
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            {isEditing && (
                <Card className="border-l-4 border-l-[var(--color-accent-primary)] shadow-sm bg-white">
                    <CardHeader className="bg-[var(--color-surface-50)] text-[var(--color-text-primary)] font-semibold border-b border-[var(--color-surface-200)]">
                        Create Version {currentVersionData.version + 1}
                    </CardHeader>
                    <CardBody className="gap-4 p-6">
                        <Textarea
                            value={newCode}
                            onValueChange={setNewCode}
                            minRows={10}
                            className="font-mono text-sm leading-relaxed"
                            classNames={{
                                inputWrapper: "bg-[var(--color-code-bg)] border-[var(--color-surface-200)]"
                            }}
                        />
                        <div className="flex gap-3 justify-end items-center mt-2">
                            <input
                                type="password"
                                placeholder="Admin Password"
                                className="px-4 py-2 border border-[var(--color-surface-200)] rounded-lg outline-none focus:border-[var(--color-accent-primary)] text-sm w-48 transition-colors"
                                value={adminPassword}
                                onChange={e => setAdminPassword(e.target.value)}
                            />
                            <Button onPress={handleNewVersion} color="primary" className="bg-[var(--color-accent-primary)] font-medium">
                                Publish Update
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left: Code Viewer - spanning 3 cols */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="border border-[var(--color-surface-200)] shadow-sm overflow-hidden h-full flex flex-col bg-white">
                        {/* Toolbar */}
                        <div className="flex justify-between items-center p-3 border-b border-[var(--color-surface-200)] bg-[var(--color-surface-50)]">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-white rounded-lg border border-[var(--color-surface-200)] p-1">
                                    <button
                                        onClick={() => setViewMode('code')}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'code' ? 'bg-[var(--color-surface-200)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
                                    >
                                        Code
                                    </button>
                                    <button
                                        onClick={() => setViewMode('diff')}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'diff' ? 'bg-[var(--color-surface-200)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
                                    >
                                        Diff
                                    </button>
                                </div>

                                <div className="h-4 w-[1px] bg-[var(--color-surface-200)] mx-1"></div>

                                <Select
                                    aria-label="Select Version"
                                    className="w-32"
                                    classNames={{
                                        trigger: "h-8 min-h-0 bg-white border border-[var(--color-surface-200)] shadow-none",
                                        value: "text-xs font-medium",
                                    }}
                                    selectedKeys={selectedVersion ? [selectedVersion.toString()] : []}
                                    onChange={(e) => setSelectedVersion(Number(e.target.value))}
                                >
                                    {data.versions.map((v) => (
                                        <SelectItem key={v.version} textValue={`v${v.version}`} className="text-xs">
                                            Version {v.version}
                                        </SelectItem>
                                    ))}
                                </Select>

                                {viewMode === 'diff' && (
                                    <>
                                        <span className="text-xs text-[var(--color-text-tertiary)]">vs</span>
                                        <Select
                                            aria-label="Compare Version"
                                            className="w-32"
                                            classNames={{
                                                trigger: "h-8 min-h-0 bg-white border border-[var(--color-surface-200)] shadow-none",
                                                value: "text-xs font-medium",
                                            }}
                                            selectedKeys={compareVersion ? [compareVersion.toString()] : []}
                                            onChange={(e) => setCompareVersion(Number(e.target.value))}
                                        >
                                            {data.versions.map((v) => (
                                                <SelectItem key={v.version} textValue={`v${v.version}`} className="text-xs">
                                                    Version {v.version}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </>
                                )}
                            </div>

                            <Button
                                onPress={handleCopyCode}
                                size="sm"
                                variant="flat"
                                className={`text-xs h-8 font-medium ${successMsg ? "bg-[var(--color-success)] text-white" : "bg-white border border-[var(--color-surface-200)]"}`}
                            >
                                {successMsg || "Copy Code"}
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-grow">
                            <CodeDisplay
                                code={currentVersionData.code}
                                language={currentVersionData.language}
                                compareCode={compareVersionData?.code}
                                viewMode={viewMode}
                            />
                        </div>
                    </Card>
                </div>

                {/* Right: Console/Logs - spanning 1 col */}
                <div className="lg:col-span-1 space-y-4">
                    <ConsoleSection
                        feedbackList={feedbackList || []}
                        onSubmitFeedback={submitFeedback}
                        isLoading={false}
                    />

                    {/* Placeholder for future features or stats */}
                    <Card className="border border-[var(--color-surface-200)] shadow-sm bg-gradient-to-br from-[var(--color-surface-50)] to-white">
                        <CardBody className="p-4">
                            <div className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">Metadata</div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">Lines</span>
                                    <span className="font-mono">{currentVersionData.code.split('\n').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">Size</span>
                                    <span className="font-mono">{new Blob([currentVersionData.code]).size}B</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

            </div>
        </div>
    );
}
