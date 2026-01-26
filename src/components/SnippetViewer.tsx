import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Textarea, Card, CardBody, CardHeader, Select, SelectItem, Chip, Tab, Tabs, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import * as Diff from 'diff';
import Provider from "./Provider";

// --- Sub-components ---

function ConsoleSection({ feedbackList, onSubmitFeedback, isLoading }: { feedbackList: any[], onSubmitFeedback: (content: string) => void, isLoading: boolean }) {
    const [inputContent, setInputContent] = useState("");
    const [copyStatus, setCopyStatus] = useState("Copy Latest Log");

    const latestLog = useMemo(() => {
        if (!feedbackList || feedbackList.length === 0) return null;
        return feedbackList.reduce((latest, current) => {
            return new Date(current.createdAt).getTime() > new Date(latest.createdAt).getTime() ? current : latest;
        }, feedbackList[0]);
    }, [feedbackList]);

    const handleCopy = () => {
        if (!latestLog) return;
        const text = `[${new Date(latestLog.createdAt).toISOString()}] ${latestLog.content}`;
        navigator.clipboard.writeText(text);
        setCopyStatus("Copied!");
        setTimeout(() => setCopyStatus("Copy Latest Log"), 2000);
    };

    const handleSubmit = () => {
        if (!inputContent.trim()) return;
        onSubmitFeedback(inputContent);
        setInputContent("");
    };

    return (
        <Card className="border border-[var(--color-surface-200)] shadow-sm h-full rounded-none md:rounded-xl border-t-0 md:border-t">
            <CardHeader className="flex justify-between items-center py-4 px-6 bg-[var(--color-surface-50)] border-b border-[var(--color-surface-200)]">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-[var(--color-text-secondary)] font-mono uppercase tracking-wider">Console Output</span>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={handleCopy}
                        isDisabled={!latestLog}
                        className="text-xs h-8 font-medium"
                    >
                        {copyStatus}
                    </Button>
                </div>
            </CardHeader>
            <CardBody className="p-0 flex flex-col h-[600px]">
                <div className="flex-grow overflow-y-auto bg-[var(--color-code-bg)] p-4 font-mono text-xs space-y-2">
                    {feedbackList?.map((fb) => {
                        const isLatest = latestLog && fb._id === latestLog._id;
                        return (
                            <div key={fb._id} className={`flex gap-3 -mx-2 px-2 py-1 rounded transition-colors ${isLatest ? 'bg-[var(--color-surface-200)] border border-[var(--color-surface-300)]' : 'hover:bg-[var(--color-surface-100)] border border-transparent'}`}>
                                <span className="text-[var(--color-text-tertiary)] select-none shrink-0 w-24">
                                    {new Date(fb.createdAt).toLocaleTimeString([], { hour12: false })}
                                </span>
                                <span className={`whitespace-pre-wrap break-all ${isLatest ? 'text-[var(--color-text-primary)] font-semibold' : 'text-[var(--color-text-primary)]'}`}>{fb.content}</span>
                            </div>
                        );
                    })}
                    {feedbackList?.length === 0 && (
                        <div className="text-[var(--color-text-tertiary)] italic p-2">No logs available.</div>
                    )}
                </div>
                <div className="p-4 border-t border-[var(--color-surface-200)] bg-[var(--color-surface-50)]">
                    <div className="flex gap-2 items-end">
                        <span className="text-[var(--color-accent-primary)] font-mono py-2 select-none">{'>'}</span>
                        <Textarea
                            placeholder="Enter log or feedback..."
                            value={inputContent}
                            onValueChange={setInputContent}
                            minRows={1}
                            maxRows={6}
                            className="font-mono text-sm"
                            classNames={{
                                input: "bg-transparent",
                                inputWrapper: "bg-white border-[var(--color-surface-200)] shadow-sm"
                            }}
                        />
                        <Button
                            color="primary"
                            className="h-10 px-6 bg-[var(--color-accent-primary)] font-medium"
                            onPress={handleSubmit}
                            isLoading={isLoading}
                        >
                            Send
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

function CodeDisplay({ code, language, compareCode, viewMode }: { code: string, language: string, compareCode?: string, viewMode: 'code' | 'diff' }) {
    if (viewMode === 'code' || !compareCode) {
        const lines = code.split('\n');
        return (
            <div className="relative group flex bg-[var(--color-code-bg)] min-h-[600px] text-sm font-mono overflow-auto">
                {/* Line Numbers */}
                <div className="flex flex-col text-right select-none bg-[var(--color-surface-100)] border-r border-[var(--color-surface-200)] py-4 px-2 min-w-[3rem] text-[var(--color-text-tertiary)]">
                    {lines.map((_, i) => (
                        <span key={i} className="leading-relaxed px-1">{i + 1}</span>
                    ))}
                </div>

                {/* Code Content */}
                <pre className="flex-1 p-4 overflow-auto text-[var(--color-text-primary)] leading-relaxed">
                    <code className={`language-${language} table`}>{code}</code>
                </pre>
            </div>
        );
    }

    const diff = Diff.diffLines(compareCode, code);
    let oldLineCounter = 1;
    let newLineCounter = 1;

    // Flatten diff parts into lines for unified view with line numbers
    // This approach iterates parts and their internal lines to render row by row if needed,
    // or just render blocks with line number ranges. 
    // To strictly match "line numbers in diff", rendering by line is safest.

    // Convert diff parts to a list of rows
    const rows: { type: 'added' | 'removed' | 'unchanged', content: string, oldLine: number | null, newLine: number | null }[] = [];

    diff.forEach(part => {
        if (!part.value) return;
        const lines = part.value.split('\n');
        // diffLines often ends with a newline which creates an empty string at end of split.
        // We generally ignore the last empty string if it comes from the split of a trailing newline.
        if (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop();
        }

        lines.forEach(line => {
            if (part.added) {
                rows.push({ type: 'added', content: line, oldLine: null, newLine: newLineCounter++ });
            } else if (part.removed) {
                rows.push({ type: 'removed', content: line, oldLine: oldLineCounter++, newLine: null });
            } else {
                rows.push({ type: 'unchanged', content: line, oldLine: oldLineCounter++, newLine: newLineCounter++ });
            }
        });
    });

    return (
        <div className="flex bg-[var(--color-code-bg)] overflow-x-auto font-mono text-sm leading-relaxed min-h-[600px]">
            {/* Line Numbers Column */}
            <div className="flex flex-col text-right select-none bg-[var(--color-surface-100)] border-r border-[var(--color-surface-200)] py-4 px-2 min-w-[3rem] text-[var(--color-text-tertiary)] shrink-0">
                {rows.map((row, i) => (
                    <div key={i} className="flex cursor-default leading-relaxed justify-end">
                        <span className="px-1">{row.newLine || '\u00A0'}</span>
                    </div>
                ))}
            </div>

            {/* Content Column */}
            <div className="flex-1 py-4 overflow-auto">
                {rows.map((row, i) => {
                    let bgColor = 'bg-transparent';
                    let textColor = 'text-[var(--color-text-primary)]';

                    if (row.type === 'added') {
                        bgColor = 'bg-[#e6ffec]'; // Light green
                        textColor = 'text-[#155724]'; // Dark green
                    } else if (row.type === 'removed') {
                        bgColor = 'bg-[#ffebe9]'; // Light red
                        textColor = 'text-[#cb2431]'; // Dark red
                    }

                    return (
                        <div key={i} className={`${bgColor} ${textColor} px-4 w-full whitespace-pre-wrap flex leading-relaxed hover:opacity-90`}>
                            <span>{row.content}</span>
                        </div>
                    );
                })}
            </div>
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
    const [activeTab, setActiveTab] = useState<string>("code");

    const [adminPassword, setAdminPassword] = useState("");
    const [tempPassword, setTempPassword] = useState(""); // For the modal
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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

    const handleStartEdit = () => {
        if (isEditing) {
            setIsEditing(false);
            setAdminPassword("");
            setNewCode("");
        } else {
            setTempPassword("");
            setIsPasswordModalOpen(true);
        }
    };

    const handlePasswordSubmit = () => {
        if (!tempPassword) return;
        setAdminPassword(tempPassword);
        setIsPasswordModalOpen(false);
        setIsEditing(true);
        setNewCode(currentVersionData.code);
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
            setAdminPassword(""); // Clear password after success
            alert("New version published successfully!");
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
                        onPress={handleStartEdit}
                        variant="bordered"
                        className="border-[var(--color-surface-200)] text-[var(--color-text-secondary)] font-medium bg-white"
                    >
                        {isEditing ? "Cancel Edit" : "Edit / Version (+)"}
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            {isEditing && (
                <Card className="border-l-4 border-l-[var(--color-accent-primary)] shadow-sm bg-white mb-6">
                    <CardHeader className="bg-[var(--color-surface-50)] text-[var(--color-text-primary)] font-semibold border-b border-[var(--color-surface-200)] flex justify-between items-center">
                        <span>Create Version {currentVersionData.version + 1}</span>
                        <div className="text-xs text-[var(--color-text-tertiary)] font-normal">
                            Authorized Session (Password Provided)
                        </div>
                    </CardHeader>
                    <CardBody className="gap-4 p-6">
                        <Textarea
                            value={newCode}
                            onValueChange={setNewCode}
                            minRows={10}
                            className="font-mono text-sm leading-relaxed"
                            classNames={{
                                inputWrapper: "bg-[var(--color-code-bg)] border-[var(--color-surface-200)] focus-within:border-[var(--color-accent-primary)]"
                            }}
                        />
                        <div className="flex gap-3 justify-end items-center mt-2">
                            <Button onPress={handleNewVersion} color="primary" className="bg-[var(--color-accent-primary)] font-medium px-6">
                                Publish Update
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onOpenChange={setIsPasswordModalOpen}
                backdrop="blur"
                classNames={{
                    base: "bg-white border border-[var(--color-surface-200)] shadow-xl",
                    header: "border-b border-[var(--color-surface-200)] p-4",
                    body: "p-6",
                    footer: "border-t border-[var(--color-surface-200)] p-4"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Admin Access Required</h2>
                                <p className="text-sm font-normal text-[var(--color-text-tertiary)]">Please enter the admin password to edit this snippet.</p>
                            </ModalHeader>
                            <ModalBody>
                                <Input
                                    label="Password"
                                    placeholder="Enter admin password"
                                    type="password"
                                    variant="bordered"
                                    value={tempPassword}
                                    onValueChange={setTempPassword}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handlePasswordSubmit();
                                    }}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="primary" onPress={handlePasswordSubmit} className="bg-[var(--color-accent-primary)]">
                                    Verify & Edit
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Main Tabs */}
            <div className="flex flex-col gap-4">
                <div className="flex w-full flex-col">
                    <Tabs
                        aria-label="Snippet Views"
                        variant="underlined"
                        color="primary"
                        selectedKey={activeTab}
                        onSelectionChange={(key) => setActiveTab(key as string)}
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-[var(--color-surface-200)]",
                            cursor: "w-full bg-[var(--color-accent-primary)]",
                            tab: "max-w-fit px-0 h-12",
                            tabContent: "group-data-[selected=true]:text-[var(--color-accent-primary)] font-medium text-[var(--color-text-secondary)]"
                        }}
                    >
                        <Tab key="code" title="Code" />
                        <Tab key="console" title={
                            <div className="flex items-center gap-2">
                                <span>Console</span>
                                {feedbackList && feedbackList.length > 0 && (
                                    <Chip size="sm" variant="flat" className="text-xs h-5 bg-[var(--color-surface-200)] text-[var(--color-text-tertiary)]">{feedbackList.length}</Chip>
                                )}
                            </div>
                        } />
                    </Tabs>
                </div>

                {/* Tab Content */}
                <div className="mt-2">
                    {activeTab === "code" && (
                        <Card className="border border-[var(--color-surface-200)] shadow-sm overflow-hidden flex flex-col bg-white rounded-none md:rounded-xl border-t-0 md:border-t">
                            {/* Toolbar inside Code Tab */}
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
                            <CodeDisplay
                                code={currentVersionData.code}
                                language={currentVersionData.language}
                                compareCode={compareVersionData?.code}
                                viewMode={viewMode}
                            />
                        </Card>
                    )}

                    {activeTab === "console" && (
                        <ConsoleSection
                            feedbackList={feedbackList || []}
                            onSubmitFeedback={submitFeedback}
                            isLoading={false}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
