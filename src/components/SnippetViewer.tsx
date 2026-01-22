import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Textarea, Card, CardBody, CardHeader, Select, SelectItem } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import * as Diff from 'diff';
import Provider from "./Provider";

function CodeDisplay({ code, language, previousCode }: { code: string, language: string, previousCode?: string }) {
    if (!previousCode) {
        return (
            <pre className="p-4 bg-gray-50 rounded-xl overflow-x-auto border border-gray-200 text-sm font-mono text-black">
                <code className={`language-${language}`}>{code}</code>
            </pre>
        );
    }

    const diff = Diff.diffLines(previousCode, code);

    return (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 font-mono text-sm">
            {diff.map((part, index) => {
                const color = part.added ? 'bg-green-100 text-green-900' : part.removed ? 'bg-red-100 text-red-900' : 'bg-white text-gray-800';
                const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                return (
                    <div key={index} className={`${color} px-4 py-0.5 whitespace-pre-wrap flex`}>
                        <span className="w-6 select-none opacity-50 block flex-shrink-0">{prefix}</span>
                        <span>{part.value}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function SnippetViewer({ publicId }: { publicId: string }) {
    const data = useQuery(api.snippets.getSnippet, { publicId });
    const addFeedback = useMutation(api.snippets.addFeedback);
    const createVersion = useMutation(api.snippets.createVersion);

    const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
    const [feedbackContent, setFeedbackContent] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [newCode, setNewCode] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (data && selectedVersion === null) {
            setSelectedVersion(data.snippet.latestVersion);
        }
    }, [data, selectedVersion]);

    if (data === undefined) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;
    if (data === null) return <div className="text-center p-10 text-red-500">Snippet not found</div>;

    const currentVersionData = data.versions.find(v => v.version === selectedVersion) || data.versions[data.versions.length - 1];
    const previousVersionData = data.versions.find(v => v.version === (currentVersionData.version - 1));
    const feedbackList = useQuery(api.snippets.getFeedback, currentVersionData ? { snippetVersionId: currentVersionData._id } : "skip");

    const handleCopy = () => {
        navigator.clipboard.writeText(currentVersionData.code);
        setSuccessMsg("Copied to clipboard!");
        setTimeout(() => setSuccessMsg(""), 2000);
    };

    const submitFeedback = async () => {
        if (!feedbackContent.trim() || !currentVersionData) return;
        await addFeedback({
            snippetVersionId: currentVersionData._id,
            content: feedbackContent
        });
        setFeedbackContent("");
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
            setSuccessMsg("New version published!");
            setSelectedVersion(Number(currentVersionData.version) + 1);
        } catch (e: any) {
            alert("Failed to update: " + e.message);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Snippet #{publicId}</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">
                            {currentVersionData.language}
                        </span>
                        <span className="text-sm bg-blue-50 px-2 py-1 rounded-full text-blue-600 font-medium">
                            v{currentVersionData.version}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Select
                        aria-label="Select Version"
                        labelPlacement="outside"
                        className="w-32 font-sans"
                        selectedKeys={selectedVersion ? [selectedVersion.toString()] : []}
                        onChange={(e) => setSelectedVersion(Number(e.target.value))}
                    >
                        {data.versions.map((v) => (
                            <SelectItem key={v.version} textValue={`v${v.version}`}>
                                Version {v.version}
                            </SelectItem>
                        ))}
                    </Select>
                    <Button onPress={handleCopy} variant="flat" color="primary">
                        {successMsg === "Copied to clipboard!" ? "Copied!" : "Copy Code"}
                    </Button>
                    <Button onPress={() => { setIsEditing(!isEditing); setNewCode(currentVersionData.code); }} variant="light">
                        {isEditing ? "Cancel Edit" : "Edit / New Version"}
                    </Button>
                </div>
            </header>

            {isEditing && (
                <Card className="border-2 border-blue-500 shadow-md">
                    <CardHeader className="bg-blue-50 font-semibold text-blue-700">Submit New Version</CardHeader>
                    <CardBody className="gap-4">
                        <Textarea
                            value={newCode}
                            onValueChange={setNewCode}
                            minRows={10}
                            className="font-mono"
                        />
                        <div className="flex gap-2">
                            <input
                                type="password"
                                placeholder="Admin Password"
                                className="px-3 py-2 border rounded-lg outline-none w-full max-w-xs"
                                value={adminPassword}
                                onChange={e => setAdminPassword(e.target.value)}
                            />
                            <Button onPress={handleNewVersion} color="primary">Publish Update</Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardBody className="p-0">
                            <CodeDisplay
                                code={currentVersionData.code}
                                language={currentVersionData.language}
                                previousCode={previousVersionData?.code}
                            />
                        </CardBody>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader className="font-bold border-b">
                            Feedback / Console Output
                        </CardHeader>
                        <CardBody className="max-h-[500px] overflow-y-auto gap-4">
                            {feedbackList?.map((fb) => (
                                <div key={fb._id} className="bg-gray-50 p-3 rounded-lg text-sm font-mono border border-gray-100">
                                    <div className="text-gray-400 text-xs mb-1">
                                        {formatDistanceToNow(fb.createdAt)} ago
                                    </div>
                                    <div className="whitespace-pre-wrap break-words">
                                        {fb.content}
                                    </div>
                                </div>
                            ))}
                            {feedbackList?.length === 0 && (
                                <p className="text-gray-400 text-center py-4 text-sm">No feedback yet.</p>
                            )}
                        </CardBody>
                        <div className="p-4 border-t bg-gray-50">
                            <Textarea
                                placeholder="Paste console output or error here..."
                                value={feedbackContent}
                                onValueChange={setFeedbackContent}
                                minRows={3}
                                className="mb-2 font-mono text-sm bg-white"
                                variant="bordered"
                            />
                            <Button
                                size="sm"
                                color="secondary"
                                className="w-full"
                                onPress={submitFeedback}
                                isDisabled={!feedbackContent.trim()}
                            >
                                Submit Feedback
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
