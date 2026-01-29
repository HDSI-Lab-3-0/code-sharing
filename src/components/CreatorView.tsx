import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Input, Textarea, Card, CardBody, CardHeader, Select, SelectItem as NextSelectItem } from "@heroui/react";
import type { SelectItemProps } from "@heroui/select";
import Provider from "./Provider";
import { LANGUAGE_OPTIONS } from "../lib/highlighter";

// Create a type-safe SelectItem component
const SelectItem = (props: SelectItemProps) => (
  <NextSelectItem {...props}>
    {props.children}
  </NextSelectItem>
);

function CreatorViewContent() {
    const [gatePassword, setGatePassword] = useState("");
    const [isGateOpen, setIsGateOpen] = useState(false);

    // Form state
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const createSnippet = useMutation(api.snippets.createSnippet);

    const handleGateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (gatePassword.trim()) {
            setIsGateOpen(true);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError("");
        try {
            const publicId = await createSnippet({
                code,
                language,
                password: gatePassword, // Use the password from state
            });
            window.location.href = `/${publicId}`;
        } catch (err: any) {
            setError(err.message || "Failed to create snippet");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isGateOpen) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--color-surface-100)]">
                <Card className="w-full max-w-md shadow-lg border border-[var(--color-surface-200)]">
                    <CardHeader className="flex flex-col gap-2 pb-0 border-b border-[var(--color-surface-200)] bg-[var(--color-surface-50)] p-6 text-center">
                        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Admin Access Required</h1>
                        <p className="text-[var(--color-text-secondary)] text-sm">Enter the admin password to create a new snippet.</p>
                    </CardHeader>
                    <CardBody className="gap-6 p-6 bg-white">
                        <form onSubmit={handleGateSubmit} className="flex flex-col gap-4">
                            <Input
                                label="Admin Password"
                                type="password"
                                placeholder="Enter password"
                                value={gatePassword}
                                onValueChange={setGatePassword}
                                variant="bordered"
                                isRequired
                                autoFocus
                                classNames={{
                                    inputWrapper: "bg-white"
                                }}
                            />
                            <Button
                                type="submit"
                                color="primary"
                                className="w-full font-semibold bg-[var(--color-accent-primary)]"
                                isDisabled={!gatePassword}
                            >
                                Continue
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--color-surface-100)]">
            <Card className="w-full max-w-4xl shadow-lg border border-[var(--color-surface-200)]">
                <CardHeader className="flex flex-row justify-between items-center pb-0 border-b border-[var(--color-surface-200)] bg-[var(--color-surface-50)] p-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">New Snippet</h1>
                        <p className="text-[var(--color-text-secondary)] text-sm">Authorized Session</p>
                    </div>
                    <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => { setIsGateOpen(false); setGatePassword(""); }}
                    >
                        Lock
                    </Button>
                </CardHeader>
                <CardBody className="gap-6 p-6 bg-white">
                    <div className="flex gap-4">
                        <div className="w-56">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="auto">Auto-detect</option>
                                {LANGUAGE_OPTIONS.map((lang) => (
                                    <option key={lang.id} value={lang.id}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Textarea
                        label="Code Content"
                        placeholder="// Paste your code here..."
                        minRows={20}
                        value={code}
                        onValueChange={setCode}
                        variant="bordered"
                        className="font-mono text-sm"
                        classNames={{
                            inputWrapper: "bg-[var(--color-code-bg)] border-[var(--color-surface-200)] focus-within:border-[var(--color-accent-primary)]"
                        }}
                        isRequired
                    />

                    {error && <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">{error}</div>}

                    <div className="flex justify-end pt-2">
                        <Button
                            color="primary"
                            onPress={handleSubmit}
                            isLoading={isLoading}
                            isDisabled={!code}
                            className="bg-[var(--color-accent-primary)] font-semibold px-8"
                        >
                            Create Snippet
                        </Button>
                    </div>
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
