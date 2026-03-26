"use client";

import { useState, useEffect } from "react";
import { useChat } from "ai/react";
import type { DocMeta, StoredMessage } from "@/types";
import { generateDocId, loadStorage, STORAGE_KEY } from "@/lib/storage";
import { useSources } from "@/hooks/useSources";

export function useDocSession() {
  const [activeDocId, setActiveDocId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return loadStorage()?.activeDocId ?? generateDocId();
    }
    return generateDocId();
  });

  const [docs, setDocs] = useState<Record<string, DocMeta>>(() => {
    if (typeof window !== "undefined") return loadStorage()?.docs ?? {};
    return {};
  });

  const [inactiveMessages, setInactiveMessages] = useState<Record<string, StoredMessage[]>>(() => {
    if (typeof window !== "undefined") {
      const s = loadStorage();
      if (!s) return {};
      const { [s.activeDocId]: _, ...rest } = s.messages ?? {};
      return rest;
    }
    return {};
  });

  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { messages, input, setInput, handleSubmit, isLoading, data, setMessages } = useChat({
    api: "/api/chat",
    body: { docId: activeDocId },
    initialMessages: (() => {
      if (typeof window !== "undefined") {
        const s = loadStorage();
        return (s?.messages[s.activeDocId] as StoredMessage[]) ?? [];
      }
      return [];
    })(),
  });

  // Persist all state to localStorage on change
  useEffect(() => {
    const allMessages: Record<string, StoredMessage[]> = {
      ...inactiveMessages,
      [activeDocId]: messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeDocId, docs, messages: allMessages }));
  }, [messages, docs, activeDocId, inactiveMessages]);

  const switchDoc = (docId: string) => {
    if (docId === activeDocId) return;
    const currentMsgs = messages.map((m) => ({ id: m.id, role: m.role, content: m.content }));
    setInactiveMessages((prev) => ({ ...prev, [activeDocId]: currentMsgs }));
    setActiveDocId(docId);
    setUploadError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMessages((inactiveMessages[docId] ?? []) as any[]);
  };

  const startNewUpload = () => {
    const newDocId = generateDocId();
    const currentMsgs = messages.map((m) => ({ id: m.id, role: m.role, content: m.content }));
    setInactiveMessages((prev) => ({ ...prev, [activeDocId]: currentMsgs }));
    setActiveDocId(newDocId);
    setMessages([]);
    setUploadError(null);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadStep(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("docId", activeDocId);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });

      if (!res.ok || !res.body) {
        const result = await res.json();
        setUploadError(result.error || "Upload failed.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n").filter(Boolean);
        for (const line of lines) {
          const data = JSON.parse(line);
          if (data.error) { setUploadError(data.error); return; }
          if (data.label) setUploadStep(data.label);
          if (data.success) {
            setDocs((prev) => ({
              ...prev,
              [activeDocId]: { filename: data.filename, chunks: data.chunks, pages: data.pages },
            }));
            setMessages([]);
            setUploadStep(null);

            // Fire-and-forget: generate AI summary + questions in background
            fetch("/api/init-doc", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ docId: activeDocId }),
            })
              .then((r) => r.json())
              .then(({ summary, questions }) => {
                if (summary || questions?.length) {
                  setDocs((prev) => ({
                    ...prev,
                    [activeDocId]: { ...prev[activeDocId], summary, suggestedQuestions: questions },
                  }));
                }
              })
              .catch(() => {}); // non-critical — silently ignore
          }
        }
      }
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
      setUploadStep(null);
    }
  };

  const deleteDoc = async (docId: string) => {
    // Clean up Upstash namespace
    await fetch("/api/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId }),
    }).catch(() => {});

    // Remove from local state
    setDocs((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    setInactiveMessages((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });

    // If deleting the active doc, switch to first remaining or start fresh
    if (docId === activeDocId) {
      const remaining = Object.keys(docs).filter((id) => id !== docId);
      if (remaining.length > 0) {
        switchDoc(remaining[0]);
      } else {
        const newDocId = generateDocId();
        setActiveDocId(newDocId);
        setMessages([]);
        setUploadError(null);
      }
    }
  };

  const exportTranscript = () => {
    const activeDoc = docs[activeDocId] ?? null;
    const lines = messages
      .map((m) => `[${m.role === "user" ? "You" : "AI"}]\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob(
      [`# Chat Transcript\nDocument: ${activeDoc?.filename ?? "unknown"}\n\n---\n\n${lines}`],
      { type: "text/markdown" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${activeDoc?.filename?.replace(".pdf", "") ?? "chat"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sources = useSources(data);

  return {
    activeDocId,
    activeDoc: docs[activeDocId] ?? null,
    docs,
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
  };
}
