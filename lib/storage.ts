import type { DocMeta, StoredMessage } from "@/types";

export const STORAGE_KEY = "ai-doc-chat-v2";

export type StoredData = {
  activeDocId: string;
  docs: Record<string, DocMeta>;
  messages: Record<string, StoredMessage[]>;
};

export function generateDocId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadStorage(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredData;
  } catch {
    return null;
  }
}
