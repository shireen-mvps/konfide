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
    <div className="border-t border-gray-100 pt-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Saved documents</p>
      <div className="flex flex-col gap-1.5">
        {otherDocs.map(([id, meta]) => (
          <div key={id} className="flex items-center gap-1 group">
            <button
              onClick={() => onSwitch(id)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left px-3 py-2 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
            >
              <span className="text-base flex-shrink-0">📄</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate group-hover:text-indigo-700">{meta.filename}</p>
                <p className="text-xs text-gray-400">{meta.pages} pages · {meta.chunks} chunks</p>
              </div>
            </button>
            <button
              onClick={() => onDelete(id)}
              title="Delete document"
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
