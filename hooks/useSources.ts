import type { Source } from "@/types";

export function useSources(data: unknown[] | undefined): Source[] {
  if (!data) return [];
  for (const item of [...data].reverse()) {
    if (
      item &&
      typeof item === "object" &&
      "sources" in item &&
      Array.isArray((item as { sources: unknown }).sources)
    ) {
      return (item as { sources: Source[] }).sources;
    }
  }
  return [];
}
