"use client";

import { useRef, useState, useCallback } from "react";
import type { DocMeta } from "@/types";

const UPLOAD_STEPS = ["extracting", "chunking", "indexing", "done"] as const;
type UploadStepKey = (typeof UPLOAD_STEPS)[number];

const STEP_LABELS: Record<UploadStepKey, string> = {
  extracting: "Extracting text",
  chunking: "Splitting into chunks",
  indexing: "Indexing",
  done: "Ready",
};

export default function UploadZone({
  onUpload,
  uploading,
  uploadStep,
  doc,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
  uploadStep: string | null;
  doc: DocMeta | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type === "application/pdf") onUpload(file);
    },
    [onUpload]
  );

  const activeStep = uploading
    ? (UPLOAD_STEPS.find((s) => uploadStep?.toLowerCase().includes(s)) ?? "extracting")
    : null;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
        dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/40"
      } ${uploading ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); }}
      />

      <div className="text-4xl mb-3">{uploading ? "⏳" : "📄"}</div>

      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-indigo-600">{uploadStep ?? "Processing PDF..."}</p>
          <div className="flex items-center gap-2">
            {(["extracting", "chunking", "indexing"] as UploadStepKey[]).map((s) => {
              const stepIndex = UPLOAD_STEPS.indexOf(s);
              const activeIndex = activeStep ? UPLOAD_STEPS.indexOf(activeStep) : -1;
              const isDone = activeIndex > stepIndex;
              const isCurrent = activeStep === s;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    isDone ? "bg-indigo-500" : isCurrent ? "bg-indigo-400 animate-pulse" : "bg-gray-200"
                  }`} />
                  <span className={`text-xs ${isCurrent ? "text-indigo-600 font-medium" : isDone ? "text-indigo-400" : "text-gray-300"}`}>
                    {STEP_LABELS[s]}
                  </span>
                  {s !== "indexing" && <span className="text-gray-200 text-xs">→</span>}
                </div>
              );
            })}
          </div>
        </div>
      ) : doc ? (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-indigo-800">{doc.filename}</p>
          <p className="text-xs text-indigo-400">{doc.pages} pages · {doc.chunks} chunks indexed</p>
          <p className="text-xs text-gray-400 mt-1">Drop or click to replace</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700">
            Drop your PDF here or <span className="text-indigo-600 underline">browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF only · Max 10MB</p>
        </>
      )}
    </div>
  );
}
