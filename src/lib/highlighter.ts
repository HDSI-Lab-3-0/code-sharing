import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";

const REGISTERED_LANGUAGES = [
  ["javascript", javascript],
  ["typescript", typescript],
  ["python", python],
  ["xml", xml],
  ["css", css],
  ["json", json],
] as const;

for (const [name, definition] of REGISTERED_LANGUAGES) {
  hljs.registerLanguage(name, definition);
}

const AUTO_DETECT_LANGUAGES = REGISTERED_LANGUAGES.map(([name]) => name);

const LANGUAGE_ALIASES: Record<string, string> = {
  xml: "html",
};

export const LANGUAGE_OPTIONS = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "json", label: "JSON" },
];

export function languageLabelFromId(id: string | null | undefined) {
  return LANGUAGE_OPTIONS.find((option) => option.id === id)?.label ?? "Unknown";
}

function normalizeLanguage(language: string | null | undefined) {
  if (!language) return null;
  return LANGUAGE_ALIASES[language] ?? language;
}

function toHighlightLanguage(language: string | null | undefined) {
  if (!language) return null;
  if (language === "html") return "xml";
  return language;
}

export function detectLanguage(code: string) {
  if (!code.trim()) return null;
  const result = hljs.highlightAuto(code, AUTO_DETECT_LANGUAGES);
  return normalizeLanguage(result.language);
}

export function highlightHtml(code: string, language?: string | null) {
  if (!code.trim()) {
    return { html: "", language: null as string | null };
  }

  const normalized = normalizeLanguage(language);
  const highlightLanguage = toHighlightLanguage(normalized);

  if (highlightLanguage) {
    const { value } = hljs.highlight(code, { language: highlightLanguage });
    return { html: value, language: normalized };
  }

  const autoResult = hljs.highlightAuto(code, AUTO_DETECT_LANGUAGES);
  return { html: autoResult.value, language: normalizeLanguage(autoResult.language) };
}
