import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const displayLanguage = language || 'code';

  return (
    <div className="relative my-3.5 rounded-xl border border-slate-800/80 bg-slate-950 overflow-hidden shadow-md text-slate-200">
      {/* Code Block Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-sky-400" />
          <span className="uppercase tracking-wider font-semibold text-slate-300">
            {displayLanguage}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-800 hover:text-white transition-colors text-slate-400 cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-sans text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="font-sans text-xs">Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-4 overflow-x-auto font-mono text-xs sm:text-[13px] leading-relaxed text-slate-100 selection:bg-sky-500/30">
        <code>{code}</code>
      </pre>
    </div>
  );
};
