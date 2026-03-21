import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Provider from "./Provider";
import { LANGUAGE_OPTIONS } from "../lib/highlighter";
import { Lock, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardBody, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";

const LANGUAGE_SELECT_OPTIONS = [{ id: "auto", label: "Auto-detect" }, ...LANGUAGE_OPTIONS];

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
            window.location.href = `${import.meta.env.BASE_URL}snippet?id=${encodeURIComponent(publicId)}`;
        } catch (err: any) {
            setError(err.message || "Failed to create snippet");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isGateOpen) {
        return (
            <div className="flex min-h-screen items-center justify-center px-6 py-16">
                <Card className="ambient-shadow w-full max-w-lg border-[#182B49]/10 bg-white/90 backdrop-blur">
                    <CardHeader className="space-y-2 border-b border-[#c5c6ce]/30 text-center">
                        <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-[#75777e]">Secure Session</p>
                        <h1 className="font-headline text-3xl font-black tracking-tight text-[#011633]">Admin Access Required</h1>
                        <p className="text-sm text-[#44474e]">Enter the admin password to launch the new snippet editor.</p>
                    </CardHeader>
                    <CardBody className="px-8 pb-10 pt-8">
                        <form onSubmit={handleGateSubmit} className="flex flex-col gap-5">
                            <label className="font-label text-xs font-bold uppercase tracking-[0.16em] text-[#75777e]">
                                Admin Password
                            </label>
                            <Input type="password" placeholder="Enter password" value={gatePassword} onChange={(e) => setGatePassword(e.target.value)} required autoFocus className="h-12 rounded-xl border-[#c5c6ce] px-4 text-base" />
                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl bg-[#011633] text-base font-semibold text-white"
                                disabled={!gatePassword}
                            >
                                <Lock className="h-4 w-4" />
                                Continue to Workspace
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#f8f9fc] text-[#191c1e]">
            <header className="sticky top-0 z-50 border-b border-[#182B49]/10 bg-slate-50/40 backdrop-blur-md shadow-sm">
                <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-8 py-4">
                    <div className="flex items-center">
                        <span className="font-headline text-2xl font-black tracking-tighter text-[#182B49]">HDSI Code Curator</span>
                    </div>
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <aside className="hidden h-[calc(100vh-76px)] w-72 flex-col space-y-8 border-r border-[#182B49]/5 bg-slate-50 p-6 font-label lg:flex">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#182b49] text-[#fecc00]">
                                <span className="text-sm font-bold">H</span>
                            </div>
                            <div>
                                <h3 className="font-headline font-bold leading-tight text-[#182B49]">Research Workspace</h3>
                                <p className="text-[10px] uppercase tracking-tighter text-slate-500">Halicioglu Data Science Institute</p>
                            </div>
                        </div>
                    </div>
                    <nav className="flex-1 space-y-1">
                        <a className="translate-x-1 flex items-center gap-3 rounded-xl bg-[#011633] px-4 py-3 text-white shadow-lg transition-all duration-200" href="#">
                            <span className="text-sm font-semibold">Create Snippet</span>
                        </a>
                    </nav>
                </aside>
                <main className="flex-1 overflow-y-auto bg-[#f2f3f6] p-8">
                    <div className="mx-auto max-w-5xl space-y-8">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div>
                                <h1 className="font-headline text-4xl font-black tracking-tight text-[#011633]">Curate New Snippet</h1>
                                <p className="mt-2 text-[#44474e]">Document your findings or share optimized algorithms with the HDSI community.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button className="ambient-shadow h-12 rounded-xl bg-[#fecc00] px-6 font-headline text-sm font-bold tracking-wide text-[#6e5700]" onClick={handleSubmit} isLoading={isLoading} disabled={!code}>
                                    Create Snippet
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <Card className="ambient-shadow rounded-xl border-none bg-white p-6">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                    <div className="lg:col-span-8">
                                        <label className="mb-1 block font-label text-[10px] font-bold uppercase tracking-widest text-slate-500">Snippet Title</label>
                                        <Input placeholder="e.g. Optimized K-Means for Genomic Data" className="h-12 border-none bg-[#f2f3f6] font-semibold text-[#011633]" />
                                    </div>
                                    <div className="lg:col-span-4">
                                        <label className="mb-1 block font-label text-[10px] font-bold uppercase tracking-widest text-slate-500">Language</label>
                                        <Select className="h-12 border-none bg-[#f2f3f6] font-mono text-sm text-[#011633]" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                            {LANGUAGE_SELECT_OPTIONS.map((item) => (
                                                <option key={item.id} value={item.id}>{item.label}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                            </Card>
                            <div className="w-full">
                                <div className="ambient-shadow flex h-[600px] w-full flex-col overflow-hidden rounded-2xl bg-[#e1e2e5]">
                                    <div className="flex items-center justify-between border-b border-[#c5c6ce]/40 bg-[#e7e8eb] px-6 py-3">
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-1.5">
                                                <div className="h-3 w-3 rounded-full bg-[#ba1a1a]/40" />
                                                <div className="h-3 w-3 rounded-full bg-[#735c00]/40" />
                                                <div className="h-3 w-3 rounded-full bg-[#4d5f80]/40" />
                                            </div>
                                            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-slate-500">main.{language === "auto" ? "txt" : language}</span>
                                        </div>
                                        <button className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/50" type="button">Copy</button>
                                    </div>
                                    <div className="flex flex-1 overflow-hidden font-mono text-sm leading-relaxed">
                                        <div className="w-12 select-none border-r border-[#c5c6ce]/40 bg-[#edeef1] py-6 text-slate-400">
                                            {Array.from({ length: 15 }).map((_, index) => (
                                                <div className="text-center" key={index}>{index + 1}</div>
                                            ))}
                                        </div>
                                        <div className="relative flex-1 bg-white">
                                            <Textarea
                                                className="h-full w-full resize-none border-none bg-transparent p-6 font-mono text-sm text-[#011633] placeholder:text-slate-300 focus-visible:ring-0"
                                                placeholder={`Paste your code here...\n\n# Example:\ndef analyze_data(dataset):\n    return dataset.groupby('research_id').mean()`}
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-[#edeef1] px-6 py-2 font-label text-[10px] font-bold text-slate-400">
                                        <div className="flex gap-4">
                                            <span>UTF-8</span>
                                            <span>{language.toUpperCase()}</span>
                                        </div>
                                        <span>Ln 1, Col 1</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {error && <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">{error}</div>}
                    </div>
                </main>
            </div>
            <footer className="mt-auto w-full border-t border-slate-200 bg-slate-100 px-8 py-12">
                <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="flex flex-col items-center gap-2 md:items-start">
                        <span className="font-headline font-bold text-[#182B49]">HDSI Code Curator</span>
                        <p className="font-label text-[10px] uppercase tracking-widest text-slate-500">© 2024 UC San Diego Halicioglu Data Science Institute. All rights reserved.</p>
                    </div>
                    <div className="flex gap-8">
                        {["Privacy Policy", "Terms of Service", "Accessibility", "Contact HDSI"].map((item) => (
                            <a key={item} className="font-label text-[10px] uppercase tracking-widest text-slate-400 underline decoration-[#fecc00] underline-offset-4 transition-colors hover:text-[#182B49]" href="#">
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
            <button
                type="button"
                className="fixed bottom-5 right-5 rounded-lg border border-[#c5c6ce] bg-white px-3 py-2 text-xs font-semibold text-[#44474e] shadow-sm"
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
