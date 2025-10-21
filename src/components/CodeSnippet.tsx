'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeSnippet({
  code,
  language = 'bash',
  title,
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative group">
      {title && (
        <div className="text-sm font-medium text-gray-400 mb-2">{title}</div>
      )}
      <div className="relative">
        <pre className="bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-4 overflow-x-auto">
          <code className={`language-${language} text-sm text-gray-200`}>
            {code}
          </code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
      {copied && (
        <div className="absolute -top-8 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-lg shadow-lg">
          Copied!
        </div>
      )}
    </div>
  );
}
