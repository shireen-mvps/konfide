import { Index } from "@upstash/vector";

// Upstash Vector client — index must be created with a built-in embedding model
export const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});
