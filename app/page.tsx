"use client";

import { useRef } from "react";
import { useDocSession } from "@/hooks/useDocSession";
import UploadZone from "@/components/UploadZone";
import ChatMessage from "@/components/ChatMessage";
import DocumentLibrary from "@/components/DocumentLibrary";

export default function Home() {
  const {
    activeDoc,
    docs,
    activeDocId,
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    sources,
    uploading,
    uploadStep,
    uploadError,
    handleUpload,
    switchDoc,
    startNewUpload,
    exportTranscript,
  } = useDocSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
              ✦
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-none">AI Doc Chat</p>
              <p className="text-xs text-gray-400 mt-0.5">RAG · Powered by Claude</p>
            </div>
          </div>
          <a
            href="https://github.com/shireen-mvps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            shireen-mvps
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Upload a document.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Ask it anything.
            </span>
          </h2>
          <p className="mt-3 text-gray-500 text-base max-w-xl mx-auto">
            Powered by RAG — Claude reads your PDF, finds the most relevant sections, and answers with source citations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Left — Upload + Library */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-0.5">
                  {activeDoc ? "Active Document" : "Your Document"}
                </h3>
                <p className="text-xs text-gray-400">Upload any PDF — menu, catalog, report, policy, manual.</p>
              </div>
              {activeDoc && (
                <button
                  onClick={startNewUpload}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-medium whitespace-nowrap ml-2 flex-shrink-0"
                >
                  + New
                </button>
              )}
            </div>

            <UploadZone onUpload={handleUpload} uploading={uploading} uploadStep={uploadStep} doc={activeDoc} />

            {uploadError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                ⚠️ {uploadError}
              </div>
            )}

            {!activeDoc && Object.keys(docs).length === 0 && (
              <div className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-3 leading-relaxed">
                <p className="font-medium text-gray-500 mb-1">Try it with:</p>
                <ul className="space-y-1">
                  <li>• A restaurant menu</li>
                  <li>• A product catalog</li>
                  <li>• An FAQ document</li>
                  <li>• A company policy PDF</li>
                  <li>• Any report or manual</li>
                </ul>
              </div>
            )}

            <DocumentLibrary docs={docs} activeDocId={activeDocId} onSwitch={switchDoc} />

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400 leading-relaxed">
                Documents are chunked, embedded, and stored in{" "}
                <span className="text-indigo-500 font-medium">Upstash Vector</span>. Each upload gets its own namespace — fully isolated.
              </p>
            </div>
          </div>

          {/* Right — Chat */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
            {activeDoc && (
              <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2">
                <span className="text-xs text-gray-400">Chatting with:</span>
                <span className="text-xs font-medium text-indigo-600 truncate">{activeDoc.filename}</span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
                  <div className="text-5xl">💬</div>
                  <p className="text-sm font-medium text-gray-500">
                    {activeDoc ? `"${activeDoc.filename}" is ready. Ask away!` : "Upload a PDF to start chatting"}
                  </p>
                  {activeDoc && (
                    <div className="flex flex-col gap-2 mt-2 w-full max-w-xs">
                      {["What is this document about?", "Give me a summary.", "What are the key points?"].map((q) => (
                        <button
                          key={q}
                          onClick={() => setInput(q)}
                          className="text-xs px-3 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                return (
                  <ChatMessage
                    key={m.id}
                    role={m.role as "user" | "assistant"}
                    content={m.content}
                    sources={isLast && m.role === "assistant" ? sources : undefined}
                  />
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">Searching document...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeDoc ? "Ask a question about your document..." : "Upload a PDF first"}
                  disabled={!activeDoc || isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!activeDoc || !input.trim() || isLoading}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
                >
                  Send
                </button>
              </form>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  Answers grounded in your document · Source citations included
                </p>
                {messages.length > 0 && (
                  <button
                    onClick={exportTranscript}
                    className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors whitespace-nowrap ml-2"
                  >
                    Export transcript
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center text-xs text-gray-400 pb-8 flex flex-col gap-1">
          <span>
            Built by{" "}
            <a href="https://github.com/shireen-mvps" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
              Shireen
            </a>
          </span>
          <span>Powered by Claude and Upstash Vector</span>
        </footer>
      </div>
    </main>
  );
}
