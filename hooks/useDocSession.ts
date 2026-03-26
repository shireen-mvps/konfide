"use client";

import { useState, useEffect } from "react";
import { useChat } from "ai/react";
import type { DocMeta, StoredMessage } from "@/types";
import { generateDocId, loadStorage, STORAGE_KEY } from "@/lib/storage";
import { useSources } from "@/hooks/useSources";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

async function saveDocToSupabase(docId: string, meta: DocMeta) {
  await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docId, meta }),
  }).catch(() => {});
}

async function fetchDocsFromSupabase(): Promise<Record<string, DocMeta>> {
  try {
    const res = await fetch("/api/documents");
    const { docs } = await res.json();
    return docs ?? {};
  } catch {
    return {};
  }
}

export function useDocSession() {
  const [user, setUser] = useState<User | null>(null);

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

  // Auth: check session on mount, load docs from Supabase if signed in
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const supabaseDocs = await fetchDocsFromSupabase();
        if (Object.keys(supabaseDocs).length > 0) {
          setDocs(supabaseDocs);
          // If current active doc isn't in Supabase, switch to first available
          if (!supabaseDocs[activeDocId]) {
            setActiveDocId(Object.keys(supabaseDocs)[0]);
            setMessages([]);
          }
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" && session?.user) {
        const supabaseDocs = await fetchDocsFromSupabase();
        if (Object.keys(supabaseDocs).length > 0) {
          setDocs(supabaseDocs);
        }
      }
      if (event === "SIGNED_OUT") {
        // Revert to whatever is in localStorage
        const stored = loadStorage();
        setDocs(stored?.docs ?? {});
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage on every state change
  useEffect(() => {
    const allMessages: Record<string, StoredMessage[]> = {
      ...inactiveMessages,
      [activeDocId]: messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeDocId, docs, messages: allMessages }));
  }, [messages, docs, activeDocId, inactiveMessages]);

  const signIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

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
            const docMeta: DocMeta = { filename: data.filename, chunks: data.chunks, pages: data.pages };
            setDocs((prev) => ({ ...prev, [activeDocId]: docMeta }));
            setMessages([]);
            setUploadStep(null);

            // Save to Supabase if signed in
            if (user) saveDocToSupabase(activeDocId, docMeta);

            // Fire-and-forget: generate AI summary + questions in background
            fetch("/api/init-doc", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ docId: activeDocId }),
            })
              .then((r) => r.json())
              .then(({ summary, questions }) => {
                if (summary || questions?.length) {
                  const updatedMeta: DocMeta = { ...docMeta, summary, suggestedQuestions: questions };
                  setDocs((prev) => ({ ...prev, [activeDocId]: updatedMeta }));
                  // Update Supabase with summary + questions
                  if (user) saveDocToSupabase(activeDocId, updatedMeta);
                }
              })
              .catch(() => {});
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
    await fetch("/api/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId }),
    }).catch(() => {});

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
    user,
    signIn,
    signOut,
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
