"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Source } from "@/types";

export default function ChatMessage({
  role,
  content,
  sources,
}: {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}) {
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col gap-2 ${role === "user" ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          role === "user"
            ? "bg-k-accent text-k-bg font-medium rounded-tr-sm"
            : "bg-k-surface2 border border-white/[0.07] text-k-text rounded-tl-sm font-mono"
        }`}
      >
        {role === "assistant" ? (
          <ReactMarkdown
            components={{
              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => <strong className="font-bold text-k-accent">{children}</strong>,
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              code: ({ children }) => (
                <code className="bg-white/[0.06] text-k-accent px-1.5 py-0.5 rounded text-xs">{children}</code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          content
        )}
      </div>

      {role === "assistant" && (
        <div className="max-w-[85%] w-full flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-k-dim hover:text-k-muted transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3 text-k-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-k-accent">Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Copy
                </>
              )}
            </button>

            {sources && sources.length > 0 && (
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1 text-xs text-k-dim hover:text-k-muted transition-colors"
              >
                <svg className={`w-3 h-3 transition-transform ${showSources ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                {sources.length} source{sources.length > 1 ? "s" : ""}
              </button>
            )}
          </div>

          {showSources && sources && sources.length > 0 && (
            <div className="flex flex-col gap-2">
              {sources.map((s, i) => (
                <div
                  key={i}
                  className="text-xs bg-k-surface2 border border-white/[0.07] rounded-xl px-3 py-2.5 text-k-muted leading-relaxed font-sans"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-k-muted text-xs">Source {i + 1}</span>
                    <span className="text-k-dim text-xs">{s.score}% match</span>
                  </div>
                  <p className="line-clamp-4 text-k-dim">{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
