import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Input, Textarea, Card, CardBody, CardHeader } from "@heroui/react";
import Provider from "./Provider";

function CreatorViewContent() {
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const createSnippet = useMutation(api.snippets.createSnippet);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError("");
        try {
            const publicId = await createSnippet({
                code,
                language,
                password,
            });
            window.location.href = `/${publicId}`;
        } catch (err: any) {
            setError(err.message || "Failed to create snippet");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--color-surface-100)]">
            <Card className="w-full max-w-3xl shadow-lg border border-[var(--color-surface-200)]">
                <CardHeader className="flex flex-col gap-2 pb-0 border-b border-[var(--color-surface-200)] bg-[var(--color-surface-50)] p-6">
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Create New Snippet</h1>
                    <p className="text-[var(--color-text-secondary)]">Share code securely with password protection.</p>
                </CardHeader>
                <CardBody className="gap-6 p-6 bg-white">
                    <Input
                        label="Admin Password"
                        type="password"
                        placeholder="Enter password to create"
                        value={password}
                        onValueChange={setPassword}
                        variant="bordered"
                        isRequired
                    />

                    <div className="flex gap-4">
                        <select
                            className="px-3 py-2 border rounded-xl border-gray-200 outline-none focus:border-blue-500 w-full bg-white"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                            <option value="json">JSON</option>
                        </select>
                    </div>

                    <Textarea
                        label="Code"
                        placeholder="Paste your code here..."
                        minRows={15}
                        value={code}
                        onValueChange={setCode}
                        variant="bordered"
                        className="font-mono"
                        isRequired
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <Button
                        color="primary"
                        onPress={handleSubmit}
                        isLoading={isLoading}
                        isDisabled={!password || !code}
                        className="w-full font-semibold"
                    >
                        Create & Share
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
}

export default function CreatorView() {
    return (
        <Provider>
            <CreatorViewContent />
        </Provider>
    );
}
