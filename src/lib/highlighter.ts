import hljs from "highlight.js/lib/core";
// Import all the languages we want to support
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import scss from "highlight.js/lib/languages/scss";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";

// Register all languages
const REGISTERED_LANGUAGES = [
  ["javascript", javascript],
  ["typescript", typescript],
  ["python", python],
  ["java", java],
  ["cpp", cpp],
  ["csharp", csharp],
  ["php", php],
  ["ruby", ruby],
  ["go", go],
  ["rust", rust],
  ["swift", swift],
  ["kotlin", kotlin],
  ["html", xml], // Using xml for HTML
  ["css", css],
  ["scss", scss],
  ["json", json],
  ["sql", sql],
  ["bash", bash],
  ["yaml", yaml],
  ["markdown", markdown],
] as const;

for (const [name, definition] of REGISTERED_LANGUAGES) {
  hljs.registerLanguage(name, definition);
}

// Languages to use for auto-detection (prioritize common ones)
const AUTO_DETECT_LANGUAGES = [
  'javascript', 'python', 'java', 'cpp', 'csharp', 'php', 'ruby', 'go',
  'rust', 'swift', 'typescript', 'kotlin', 'html', 'css', 'scss', 'json',
  'sql', 'bash', 'yaml', 'markdown'
];

// Language aliases and extensions mapping
const LANGUAGE_ALIASES: Record<string, string> = {
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'go': 'go',
  'rs': 'rust',
  'swift': 'swift',
  'kt': 'kotlin',
  'html': 'html',
  'htm': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'scss',
  'json': 'json',
  'sql': 'sql',
  'sh': 'bash',
  'yaml': 'yaml',
  'yml': 'yaml',
  'md': 'markdown'
};

export const LANGUAGE_OPTIONS = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'swift', label: 'Swift' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'json', label: 'JSON' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash' },
  { id: 'yaml', label: 'YAML' },
  { id: 'markdown', label: 'Markdown' },
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

// Try to detect language from file extension or shebang
export function detectLanguage(code: string, filename?: string): string | null {
  // First try to detect from filename
  if (filename) {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension && LANGUAGE_ALIASES[extension]) {
      return LANGUAGE_ALIASES[extension];
    }
  }

  // Then try to detect from shebang
  const firstLine = code.split('\n')[0];
  if (firstLine.startsWith('#!')) {
    if (firstLine.includes('python')) return 'python';
    if (firstLine.includes('node') || firstLine.includes('js')) return 'javascript';
    if (firstLine.includes('bash') || firstLine.includes('sh')) return 'bash';
    if (firstLine.includes('ruby')) return 'ruby';
  }

  // Fall back to highlight.js auto-detection
  if (!code.trim()) return null;
  const result = hljs.highlightAuto(code, AUTO_DETECT_LANGUAGES);
  return normalizeLanguage(result.language) || 'plaintext';
}

// Enhanced highlight function with better language detection
export function highlightHtml(code: string, language?: string | null, filename?: string) {
  if (!code.trim()) {
    return { html: "", language: null as string | null };
  }

  // If no language provided, try to detect it
  let detectedLanguage = language;
  if (!detectedLanguage) {
    detectedLanguage = detectLanguage(code, filename) || 'plaintext';
  }

  const normalized = normalizeLanguage(detectedLanguage);
  const highlightLanguage = toHighlightLanguage(normalized);

  try {
    if (highlightLanguage) {
      const { value } = hljs.highlight(code, { 
        language: highlightLanguage,
        ignoreIllegals: true // More lenient parsing
      });
      return { 
        html: value, 
        language: normalized || 'plaintext' 
      };
    }
  } catch (e) {
    console.warn(`Failed to highlight as ${highlightLanguage}:`, e);
  }

  // Fallback to auto-detection if specific language highlighting fails
  try {
    const autoResult = hljs.highlightAuto(code, AUTO_DETECT_LANGUAGES);
    return { 
      html: autoResult.value, 
      language: normalizeLanguage(autoResult.language) || 'plaintext' 
    };
  } catch (e) {
    console.error('Auto-highlighting failed:', e);
    return { 
      html: hljs.highlight(code, { language: 'plaintext' }).value, 
      language: 'plaintext' 
    };
  }
}
