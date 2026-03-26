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

  return (
    <div className={`flex flex-col gap-2 ${role === "user" ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          role === "user"
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
        }`}
      >
        {role === "assistant" ? (
          <ReactMarkdown
            components={{
              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          content
        )}
      </div>

      {role === "assistant" && sources && sources.length > 0 && (
        <div className="max-w-[85%] w-full">
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-500 transition-colors"
          >
            <span>{showSources ? "▼" : "▶"}</span>
            {sources.length} source{sources.length > 1 ? "s" : ""} · {showSources ? "hide" : "show"}
          </button>

          {showSources && (
            <div className="mt-2 flex flex-col gap-2">
              {sources.map((s, i) => (
                <div
                  key={i}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-600 leading-relaxed"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-500">Source {i + 1}</span>
                    <span className="text-gray-400">{s.score}% match</span>
                  </div>
                  <p className="line-clamp-4">{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
