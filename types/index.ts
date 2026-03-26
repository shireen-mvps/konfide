export type Source = { text: string; chunkIndex: number; score: number };
export type DocMeta = { filename: string; chunks: number; pages: number };
export type StoredMessage = { id: string; role: "user" | "assistant" | "system" | "data"; content: string };
