"use client";

import { useRef, useEffect } from "react";
import { useDocSession } from "@/hooks/useDocSession";
import UploadZone from "@/components/UploadZone";
import ChatMessage from "@/components/ChatMessage";
import DocumentLibrary from "@/components/DocumentLibrary";
import { GravityStarsBackground } from "@/components/GravityStarsBackground";

const USE_CASES = [
  {
    icon: "👥",
    label: "Human Resources",
    example: "What's our remote work policy?",
    desc: "Query policy handbooks, onboarding guides, and compliance docs instantly.",
  },
  {
    icon: "⚖️",
    label: "Legal",
    example: "What are the liability clauses?",
    desc: "Search contracts and agreements without exposing them to third-party AI.",
  },
  {
    icon: "📊",
    label: "Finance",
    example: "What was Q3 revenue by region?",
    desc: "Ask your quarterly reports and audits — zero data leak risk.",
  },
  {
    icon: "⚙️",
    label: "Operations",
    example: "What's the escalation procedure?",
    desc: "Surface answers from SOPs, runbooks, and vendor agreements in seconds.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Upload your document",
    desc: "PDF is parsed, chunked, and embedded. Nothing leaves your environment to OpenAI.",
  },
  {
    n: "02",
    title: "Stored in private vectors",
    desc: "Embeddings go into your own isolated namespace in Upstash Vector — siloed per document.",
  },
  {
    n: "03",
    title: "Ask with full context",
    desc: "Claude retrieves the most relevant passages and answers with source citations.",
  },
];

export default function Home() {
  const {
    user,
    signIn,
    signOut,
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
    deleteDoc,
    exportTranscript,
  } = useDocSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Scroll-reveal for How it works section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-visible")),
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-k-bg text-k-text overflow-x-hidden relative">
      {/* Gravity stars — fixed full-viewport background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GravityStarsBackground
          starsCount={110}
          starsSize={1.5}
          starsOpacity={0.45}
          glowIntensity={18}
          glowAnimation="ease"
          mouseInfluence={140}
          gravityStrength={90}
          movementSpeed={0.25}
        />
      </div>
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-k-bg/80 backdrop-blur-sm sticky top-0 z-20 relative">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-k-accent flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-k-bg text-sm leading-none">K</span>
            </div>
            <span className="font-display font-semibold text-k-text text-lg tracking-tight">Konfide</span>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-k-accent/20 border border-k-accent/30 flex items-center justify-center text-k-accent text-xs font-bold flex-shrink-0">
                  {user.email?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="text-xs text-k-muted hidden sm:block truncate max-w-[140px]">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="text-xs text-k-dim hover:text-k-muted transition-colors whitespace-nowrap"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-k-muted hover:border-k-accent/40 hover:text-k-accent transition-all btn-glow-sm"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Hero */}
        <section className="pt-16 pb-14 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-k-accent/25 bg-k-accent/[0.08] text-k-accent text-xs font-medium mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-k-accent flex-shrink-0" />
            Document Intelligence Platform
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-k-text mb-5">
            Ask your company documents<br className="hidden sm:block" /> anything.{" "}
            <span className="text-k-accent">In private.</span>
          </h1>

          {/* Subtext */}
          <p className="text-k-muted text-base max-w-xl mx-auto mb-8 leading-relaxed">
            No data sent to OpenAI. No AI training on your files.<br className="hidden sm:block" />
            Your documents stay confidential — always.
          </p>

          {/* Use case pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {["HR Policies", "Legal Contracts", "Financial Reports", "Operations SOPs"].map((label) => (
              <span
                key={label}
                className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/8 text-k-muted text-xs hover:border-k-accent/30 hover:text-k-accent transition-colors cursor-default"
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* Tool */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
          {/* Left — Upload + Library */}
          <div className="bg-k-surface rounded-2xl border border-white/[0.07] p-5 flex flex-col gap-4 card-glow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-k-text">
                  {activeDoc ? "Active Document" : "Your Document"}
                </h3>
                <p className="text-xs text-k-muted mt-0.5">Upload any PDF — policy, contract, report, manual.</p>
              </div>
              {activeDoc && (
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <button
                    onClick={startNewUpload}
                    className="text-xs text-k-accent hover:text-k-accent2 font-medium whitespace-nowrap transition-colors"
                  >
                    + New
                  </button>
                  <button
                    onClick={() => deleteDoc(activeDocId)}
                    title="Delete this document"
                    className="text-xs text-k-dim hover:text-red-400 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            <UploadZone onUpload={handleUpload} uploading={uploading} uploadStep={uploadStep} doc={activeDoc} />

            {uploadError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {uploadError}
              </div>
            )}

            {activeDoc?.summary && (
              <div className="bg-k-accent/[0.07] border border-k-accent/20 rounded-xl px-3 py-3">
                <p className="text-xs font-semibold text-k-accent mb-1">Document summary</p>
                <p className="text-xs text-k-muted leading-relaxed">{activeDoc.summary}</p>
              </div>
            )}

            {!activeDoc && Object.keys(docs).length === 0 && (
              <div className="text-xs text-k-dim bg-white/[0.03] rounded-xl px-3 py-3 leading-relaxed">
                <p className="font-medium text-k-muted mb-1.5">Works great with:</p>
                <ul className="space-y-1">
                  <li>• HR policy handbooks</li>
                  <li>• Legal contracts</li>
                  <li>• Financial reports</li>
                  <li>• Company SOPs</li>
                  <li>• Product catalogs</li>
                </ul>
              </div>
            )}

            <DocumentLibrary docs={docs} activeDocId={activeDocId} onSwitch={switchDoc} onDelete={deleteDoc} />

            <div className="border-t border-white/[0.06] pt-3">
              {user ? (
                <p className="text-xs text-k-muted flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-k-accent flex-shrink-0" />
                  Documents synced to your account
                </p>
              ) : (
                <p className="text-xs text-k-dim leading-relaxed">
                  <button onClick={signIn} className="text-k-accent hover:underline font-medium">
                    Sign in
                  </button>{" "}
                  to save documents across devices.
                </p>
              )}
            </div>
          </div>

          {/* Right — Chat */}
          <div className="bg-k-surface rounded-2xl border border-white/[0.07] flex flex-col h-[600px] card-glow">
            {activeDoc && (
              <div className="px-5 py-2.5 border-b border-white/[0.06] flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-k-dim">Chatting with:</span>
                <span className="text-xs font-medium text-k-accent truncate">{activeDoc.filename}</span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
                  <div className="w-12 h-12 rounded-2xl bg-k-accent/10 border border-k-accent/20 flex items-center justify-center text-2xl">
                    {activeDoc ? "💬" : "🔒"}
                  </div>
                  <p className="text-sm font-medium text-k-muted">
                    {activeDoc
                      ? `"${activeDoc.filename}" is ready. Ask away!`
                      : "Upload a document to start chatting"}
                  </p>
                  {activeDoc && (
                    <div className="flex flex-col gap-2 mt-2 w-full max-w-xs">
                      {(activeDoc.suggestedQuestions?.length
                        ? activeDoc.suggestedQuestions.slice(0, 3)
                        : ["What is this document about?", "Give me a summary.", "What are the key points?"]
                      ).map((q) => (
                        <button
                          key={q}
                          onClick={() => setInput(q)}
                          className="text-xs px-3 py-2 rounded-xl border border-k-accent/25 text-k-accent hover:bg-k-accent/8 transition-colors text-left btn-glow-sm"
                        >
                          {q}
                        </button>
                      ))}
                      {!activeDoc.suggestedQuestions && (
                        <p className="text-xs text-k-dim animate-pulse">Generating suggestions...</p>
                      )}
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
                  <div className="bg-k-surface2 border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-k-accent animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-k-dim">Searching document...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] p-4 flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeDoc ? "Ask a question about your document..." : "Upload a PDF first"}
                  disabled={!activeDoc || isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-k-surface2 border border-white/8 text-sm text-k-text placeholder-k-dim focus:outline-none focus:ring-1 focus:ring-k-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                />
                <button
                  type="submit"
                  disabled={!activeDoc || !input.trim() || isLoading}
                  className="px-4 py-2.5 rounded-xl bg-k-accent text-k-bg text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-k-accent2 btn-glow"
                >
                  Send
                </button>
              </form>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-k-dim">Grounded in your document · Source citations included</p>
                {messages.length > 0 && (
                  <button
                    onClick={exportTranscript}
                    className="text-xs text-k-muted hover:text-k-accent transition-colors whitespace-nowrap ml-2"
                  >
                    Export transcript
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Use Cases ── */}
      <div className="relative z-10 mt-20">
        {/* top separator */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-k-accent/70 to-transparent shadow-[0_0_12px_2px_rgba(232,160,32,0.3)]" />
        <div className="bg-k-surface2 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-k-text mb-2">
                Built for teams that handle sensitive data
              </h2>
              <p className="text-k-muted text-sm">Konfide works wherever confidential documents live.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {USE_CASES.map(({ icon, label, example, desc }) => (
                <div
                  key={label}
                  className="bg-k-surface2 border border-white/[0.07] rounded-2xl p-5 group cursor-default card-glow"
                >
                  <div className="w-10 h-10 rounded-xl bg-k-accent/10 flex items-center justify-center text-xl mb-4">
                    {icon}
                  </div>
                  <p className="font-display font-semibold text-k-text text-sm mb-1.5">{label}</p>
                  <p className="text-xs text-k-muted leading-relaxed mb-3">{desc}</p>
                  <p className="text-xs text-k-dim italic border-t border-white/[0.06] pt-3">
                    &ldquo;{example}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* bottom separator */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* ── How it works ── */}
      <div className="relative z-10">
        <div className="bg-[#0b0b11] py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12" data-reveal>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-k-text mb-2">How it works</h2>
              <p className="text-k-muted text-sm">Private by design. Powered by retrieval-augmented generation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {HOW_IT_WORKS.map(({ n, title, desc }, i) => (
                <div key={n} data-reveal data-delay={String(i + 1)}>
                  <div className="font-display text-6xl font-bold text-k-accent/15 mb-4 leading-none select-none">
                    {n}
                  </div>
                  <p className="font-display font-semibold text-k-text text-sm mb-2">{title}</p>
                  <p className="text-xs text-k-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* bottom separator */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-k-accent/50 to-transparent shadow-[0_0_10px_2px_rgba(232,160,32,0.2)]" />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-k-accent flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-k-bg text-xs leading-none">K</span>
            </div>
            <span className="font-display text-k-muted text-sm font-semibold">Konfide</span>
          </div>
          <p className="text-xs text-k-dim text-center sm:text-right">
            Built by{" "}
            <a
              href="https://github.com/shireen-mvps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-k-muted hover:text-k-accent transition-colors"
            >
              Shireen
            </a>
            {" · "}Powered by Claude + Upstash Vector
          </p>
        </div>
      </footer>
    </main>
  );
}
