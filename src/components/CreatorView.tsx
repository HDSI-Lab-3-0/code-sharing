import { useMemo, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Provider from "./Provider";
import { detectLanguage, languageLabelFromId, languageToExtension } from "../lib/highlighter";
import { withBasePath } from "../lib/utils";
import { Lock, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardBody, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

function CreatorViewContent() {
    const [gatePassword, setGatePassword] = useState("");
    const [isGateOpen, setIsGateOpen] = useState(false);
    const [isVerifyingGate, setIsVerifyingGate] = useState(false);
    const [gateError, setGateError] = useState("");

    // Form state
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const detectedLanguage = useMemo(() => detectLanguage(code) ?? "plaintext", [code]);

    const createSnippet = useMutation(api.snippets.createSnippet);
    const verifyPassword = useAction(api.auth.verifyPassword);

    const handleGateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const password = gatePassword.trim();
        if (!password) return;

        setIsVerifyingGate(true);
        setGateError("");
        try {
            await verifyPassword({ password });
            setIsGateOpen(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Invalid password";
            setGateError(message);
        } finally {
            setIsVerifyingGate(false);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError("");
        try {
            const publicId = await createSnippet({
                code,
                language: detectedLanguage,
                password: gatePassword,
            });
            window.location.href = withBasePath(`snippet?id=${encodeURIComponent(publicId)}`);
        } catch (err: any) {
            setError(err.message || "Failed to create snippet");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isGateOpen) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center px-4 py-4">
                <Card className="ambient-shadow w-full max-w-md border-[#182B49]/10 bg-white/90 backdrop-blur">
                    <CardHeader className="space-y-1 border-b border-[#c5c6ce]/30 px-5 py-3 text-center">
                        <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-[#75777e]">Secure Session</p>
                        <h1 className="font-headline text-xl font-black tracking-tight text-[#011633]">Admin Access Required</h1>
                        <p className="text-xs text-[#44474e]">Enter the admin password to launch the new snippet editor.</p>
                    </CardHeader>
                    <CardBody className="px-5 pb-5 pt-4">
                        <form onSubmit={handleGateSubmit} className="flex flex-col gap-3">
                            <label className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-[#75777e]">
                                Admin Password
                            </label>
                            <Input type="password" placeholder="Enter password" value={gatePassword} onChange={(e) => setGatePassword(e.target.value)} required autoFocus className="h-9 rounded-lg border-[#c5c6ce] px-3 text-sm" />
                            <Button
                                type="submit"
                                className="h-9 w-full rounded-lg bg-[#011633] text-sm font-semibold text-white"
                                disabled={!gatePassword}
                                isLoading={isVerifyingGate}
                            >
                                <Lock className="h-3.5 w-3.5" />
                                Continue to Workspace
                            </Button>
                            {gateError ? <p className="text-xs text-[#93000a]">{gateError}</p> : null}
                        </form>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8f9fc] text-[#191c1e]">
            <header className="z-50 shrink-0 border-b border-[#182B49]/10 bg-slate-50/40 shadow-sm backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-2">
                    <div className="flex items-center">
                        <span className="font-headline text-lg font-black tracking-tighter text-[#182B49]">HDSI Code Curator</span>
                    </div>
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
                                <p className="text-[9px] uppercase tracking-tighter text-slate-500">Halicioglu Data Science Institute</p>
                            </div>
                        </div>
                    </div>
                    <nav className="min-h-0 flex-1 space-y-1">
                        <a className="translate-x-0.5 flex items-center gap-2 rounded-lg bg-[#011633] px-3 py-2 text-white shadow-md transition-all duration-200" href="#">
                            <span className="text-xs font-semibold">Create Snippet</span>
                        </a>
                    </nav>
                </aside>
                <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f2f3f6] p-3">
                    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3 overflow-hidden">
                        <div className="flex shrink-0 flex-col justify-between gap-2 md:flex-row md:items-center">
                            <div>
                                <h1 className="font-headline text-xl font-black tracking-tight text-[#011633]">Curate New Snippet</h1>
                                <p className="mt-0.5 text-xs text-[#44474e]">Document your findings or share optimized algorithms with the HDSI community.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button className="ambient-shadow h-9 rounded-lg bg-[#fecc00] px-4 font-headline text-xs font-bold tracking-wide text-[#6e5700]" onClick={handleSubmit} isLoading={isLoading} disabled={!code}>
                                    Create Snippet
                                    <Send className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                            <Card className="ambient-shadow shrink-0 rounded-lg border-none bg-white p-3">
                                <div>
                                    <label className="mb-0.5 block font-label text-[9px] font-bold uppercase tracking-widest text-slate-500">Snippet Title</label>
                                    <Input placeholder="e.g. Optimized K-Means for Genomic Data" className="h-9 border-none bg-[#f2f3f6] text-sm font-semibold text-[#011633]" />
                                </div>
                                <p className="mt-2 font-mono text-[10px] text-[#44474e]">
                                    Language: <span className="font-semibold text-[#011633]">{languageLabelFromId(detectedLanguage)}</span> (auto-detected from code)
                                </p>
                            </Card>
                            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                                <div className="ambient-shadow flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-[#e1e2e5]">
                                    <div className="flex shrink-0 items-center border-b border-[#c5c6ce]/40 bg-[#e7e8eb] px-3 py-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="h-2 w-2 rounded-full bg-[#ba1a1a]/40" />
                                                <div className="h-2 w-2 rounded-full bg-[#735c00]/40" />
                                                <div className="h-2 w-2 rounded-full bg-[#4d5f80]/40" />
                                            </div>
                                            <span className="font-label text-[9px] font-bold uppercase tracking-widest text-slate-500">main.{languageToExtension(detectedLanguage)}</span>
                                        </div>
                                    </div>
                                    <div className="flex min-h-0 flex-1 overflow-hidden font-mono text-xs leading-relaxed">
                                        <div className="w-8 shrink-0 select-none border-r border-[#c5c6ce]/40 bg-[#edeef1] py-2 text-[10px] text-slate-400">
                                            {Array.from({ length: 15 }).map((_, index) => (
                                                <div className="text-center leading-5" key={index}>{index + 1}</div>
                                            ))}
                                        </div>
                                        <div className="relative min-h-0 min-w-0 flex-1 bg-white">
                                            <Textarea
                                                className="h-full min-h-0 w-full resize-none border-none bg-transparent p-3 font-mono text-xs text-[#011633] placeholder:text-slate-300 focus-visible:ring-0"
                                                placeholder={`Paste your code here...\n\n# Example:\ndef analyze_data(dataset):\n    return dataset.groupby('research_id').mean()`}
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center justify-between bg-[#edeef1] px-3 py-1 font-label text-[9px] font-bold text-slate-400">
                                        <div className="flex gap-3">
                                            <span>UTF-8</span>
                                            <span>{detectedLanguage.toUpperCase()}</span>
                                        </div>
                                        <span>Ln 1, Col 1</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {error && <div className="shrink-0 rounded-lg border border-[#ba1a1a]/20 bg-[#ffdad6] px-3 py-2 text-xs text-[#93000a]">{error}</div>}
                    </div>
                </main>
            </div>
            <footer className="shrink-0 border-t border-slate-200 bg-slate-100 px-4 py-1.5">
                <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[9px]">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                        <span className="font-headline font-semibold text-[#182B49]">HDSI Code Curator</span>
                        <span className="font-label uppercase tracking-widest text-slate-500">© 2024 UC San Diego HDSI</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0">
                        {["Privacy Policy", "Terms of Service", "Accessibility", "Contact HDSI"].map((item) => (
                            <a key={item} className="font-label uppercase tracking-widest text-slate-400 underline decoration-[#fecc00] underline-offset-2 transition-colors hover:text-[#182B49]" href="#">
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
            <button
                type="button"
                className="fixed bottom-2 right-2 rounded-md border border-[#c5c6ce] bg-white px-2 py-1 text-[10px] font-semibold text-[#44474e] shadow-sm"
                onClick={() => {
                    setIsGateOpen(false);
                    setGatePassword("");
                }}
            >
                Lock Session
            </button>
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
