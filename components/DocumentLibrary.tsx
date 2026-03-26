"use client";

import type { DocMeta } from "@/types";

export default function DocumentLibrary({
  docs,
  activeDocId,
  onSwitch,
  onDelete,
}: {
  docs: Record<string, DocMeta>;
  activeDocId: string;
  onSwitch: (docId: string) => void;
  onDelete: (docId: string) => void;
}) {
  const otherDocs = Object.entries(docs).filter(([id]) => id !== activeDocId);
  if (otherDocs.length === 0) return null;

  return (
    <div className="border-t border-white/[0.06] pt-3">
      <p className="text-xs font-semibold text-k-dim uppercase tracking-wider mb-2">Saved documents</p>
      <div className="flex flex-col gap-1">
        {otherDocs.map(([id, meta]) => (
          <div key={id} className="flex items-center gap-1 group">
            <button
              onClick={() => onSwitch(id)}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left px-3 py-2 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/8 transition-all"
            >
              <svg className="w-3.5 h-3.5 text-k-dim flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <div className="min-w-0">
                <p className="text-xs font-medium text-k-muted truncate group-hover:text-k-text transition-colors">
                  {meta.filename}
                </p>
                <p className="text-xs text-k-dim">{meta.pages} pages · {meta.chunks} chunks</p>
              </div>
            </button>
            <button
              onClick={() => onDelete(id)}
              title="Delete document"
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-k-dim hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
