# Konfide — Private Document Intelligence

> Ask your documents anything. Your data never leaves your control.

**Konfide** is a full-stack RAG (Retrieval-Augmented Generation) application built for organisations that need AI-powered document Q&A without compromising on confidentiality. Upload any PDF — policy, contract, report, or manual — and get source-cited answers instantly. Nothing is sent to OpenAI. Nothing trains an AI model. Nothing leaves your stack.

**Live demo:** [konfide on Vercel](https://konfide-inky.vercel.app)

---

## The Core Problem with "Just Use ChatGPT"

Most teams default to uploading sensitive documents into ChatGPT, Claude.ai, or other public AI chat tools. It feels convenient — but it carries serious hidden risks.

**When you upload a confidential document to a public LLM:**
- That document may be used to train future AI models
- It passes through third-party servers outside your control
- There is no audit trail of who accessed what
- Every query re-sends the entire document (expensive and slow at scale)
- You cannot own, customise, or deploy the pipeline

Konfide solves all of this. Document intelligence stays private and self-contained.

---

## Konfide vs. Public LLM Chat — Side by Side

| | Upload to ChatGPT / Claude.ai | Konfide |
|---|---|---|
| **Data sent to OpenAI** | Yes | Never |
| **Used to train AI models** | Possibly, per terms of service | Never — you own the data |
| **Documents stay on your infrastructure** | No | Yes — indexed in your private Upstash namespace |
| **Confidential documents protected** | Not guaranteed | Yes, by design |
| **Document size limit** | ~200k tokens (~300 pages) | Unlimited — only relevant chunks retrieved |
| **Cost per query** | High — entire doc sent every time | Low — only top 5 relevant chunks used |
| **Multi-document support** | No persistent memory | Yes — each document gets its own isolated namespace |
| **Session persistence** | Lost when the tab closes | Yes — persists across sessions |
| **Customisable pipeline** | No | Yes — chunking, retrieval, prompts, scoring |
| **Deployable by a company** | No | Yes — fully ownable infrastructure |

---

## Who It's Built For

Konfide is designed for teams that handle documents they cannot afford to expose to public AI tools.

**Human Resources** — Query policy handbooks, onboarding guides, and compliance documentation without uploading them to external services.

**Legal** — Search contracts, NDAs, and agreements privately. No clause ever touches a third-party model.

**Finance** — Ask your quarterly reports, audit documents, and forecasts questions without data leaving your environment.

**Operations** — Surface answers from SOPs, runbooks, and vendor agreements in seconds, with full source traceability.

**Healthcare, Education, Government** — Any sector where data residency and confidentiality are non-negotiable.

---

## How It Works

```
Upload PDF → Extract text → Chunk → Embed → Store in your private vector namespace
                                                        ↓
User asks question → Embed query → Retrieve top 5 matching chunks
                                                        ↓
                         Claude answers using only those chunks → Source citations shown
```

1. **Upload** — Drop a PDF. Text is extracted server-side; the raw file is never persisted.
2. **Chunk** — Text is split into overlapping segments at sentence boundaries for clean retrieval.
3. **Index** — Chunks are embedded and stored in your isolated Upstash Vector namespace — siloed per document.
4. **Query** — Your question is embedded and matched to the top 5 most relevant chunks.
5. **Answer** — Claude generates a response grounded exclusively in those chunks — no outside knowledge, no hallucination.
6. **Cite** — Every answer displays the retrieved source passages with relevance scores, with inline `[1]` `[2]` markers linking statement to source.

---

## Key Features

- **Rate limiting.** Demo access is capped at 3 uploads and 20 chat messages per IP per 24 hours via Upstash Redis. Visitors who hit the limit see a "Request full access" modal linked to a waitlist form — update `WAITLIST_URL` in `app/page.tsx` with your own Tally/Typeform URL.
- **Zero data to OpenAI.** Claude is used only to generate answers from pre-retrieved chunks — your documents never pass through it directly.
- **Private vector storage.** All embeddings live in your own Upstash Vector index, isolated per document, in the region you choose.
- **Inline source citations.** Every AI response tags statements with numbered citations `[1]` `[2]` linked directly to the retrieved passages.
- **Streaming responses.** Answers stream word by word via Vercel AI SDK — no waiting for the full response to complete.
- **Multi-document library.** Upload multiple documents and switch between them; each keeps its own isolated chat history.
- **AI document summary.** After upload, Claude generates a 2-sentence summary and five suggested questions based on actual content.
- **Session persistence.** Documents and chat history survive page refresh via localStorage, with optional Supabase sync for signed-in users.
- **Google Sign-In.** Supabase Auth with Google OAuth — documents sync across devices when signed in.
- **Export transcript.** Download any conversation as a markdown file for records or sharing.
- **Drag-and-drop upload.** With a live three-step progress indicator (Extracting → Chunking → Indexing).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| AI Model | Claude Sonnet 4.6 (Anthropic) |
| AI SDK | Vercel AI SDK v4 + @ai-sdk/anthropic |
| Vector Store | Upstash Vector (built-in embedding model) |
| Rate Limiting | Upstash Redis + @upstash/ratelimit |
| Auth | Supabase Auth (Google OAuth) |
| PDF Parsing | pdf-parse |
| Styling | Tailwind CSS v3 with custom design tokens |
| Language | TypeScript |
| Deployment | Vercel |

---

## Architecture Notes

**Why Upstash Vector?** It supports namespacing — each document gets a fully isolated index. No chunk from Document A can surface in a query about Document B. This is critical for multi-document and multi-user deployments.

**Why not send the full document to Claude?** Two reasons. First, confidentiality — sending a full contract or HR policy to any external model is a liability. Second, cost and speed — retrieving 5 relevant chunks costs a fraction of sending 300 pages on every single query.

**Why Claude for generation?** Claude is used only at the answer-generation step, receiving pre-retrieved text chunks — not your original document. The model never sees the raw file.

---

## Project Structure

```
konfide/
├── app/
│   ├── api/
│   │   ├── upload/route.ts        # Parse PDF → chunk → embed → upsert to Upstash
│   │   ├── chat/route.ts          # Query Upstash → stream Claude response + sources
│   │   ├── init-doc/route.ts      # Generate AI summary + suggested questions post-upload
│   │   ├── documents/route.ts     # Supabase document sync for signed-in users
│   │   ├── delete/route.ts        # Delete document from Upstash + Supabase
│   │   └── auth/callback/route.ts # Supabase OAuth callback
│   ├── globals.css                # Custom animations and Tailwind extensions
│   ├── layout.tsx
│   └── page.tsx                   # Full page — marketing sections + interactive tool
├── components/
│   ├── UploadZone.tsx             # Drag-drop upload with segmented progress bar
│   ├── ChatMessage.tsx            # Message rendering with markdown + inline citations
│   ├── DocumentLibrary.tsx        # Multi-doc switcher with touch-accessible delete
│   ├── GravityStarsBackground.tsx # Animated star field background
│   └── Toast.tsx                  # Toast notification system
├── hooks/
│   ├── useDocSession.ts           # State, upload logic, auth, and session persistence
│   └── useSources.ts              # Extracts source citations from AI stream data
├── lib/
│   ├── chunker.ts                 # Sentence-boundary text chunking with overlap
│   ├── storage.ts                 # localStorage helpers and session types
│   ├── upstash.ts                 # Upstash Vector client
│   └── supabase/                  # Supabase client (browser + server)
├── types/
│   └── index.ts                   # Shared TypeScript types
├── .env.local.example
└── README.md
```

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/shireen-mvps/konfide_rag.git
cd konfide_rag
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your Upstash Vector index

1. Go to [console.upstash.com](https://console.upstash.com) → **Vector** → **Create Index**
2. Choose **Dense** type with a built-in embedding model (recommended: `BAAI/bge-small-en-v1.5`)
3. Copy your **REST URL** and **REST Token**

### 4. Create your Upstash Redis database (for rate limiting)

1. Go to [console.upstash.com](https://console.upstash.com) → **Redis** → **Create Database**
2. Name it anything (e.g. `konfide-ratelimit`), pick a region close to your Vercel deployment
3. Copy your **REST URL** and **REST Token**

The free tier (10,000 commands/day) is more than enough. This is a **separate** database from your Vector index.

### 5. Set up Supabase (optional — for auth + cross-device sync)

1. Go to [supabase.com](https://supabase.com) → create a new project
2. Enable **Google OAuth** under Authentication → Providers
3. Create a `documents` table:

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  doc_id text not null,
  meta jsonb not null,
  created_at timestamptz default now()
);
alter table documents enable row level security;
create policy "Users can manage their own documents"
  on documents for all using (auth.uid() = user_id);
```

### 6. Add environment variables

```bash
cp .env.local.example .env.local
```

```env
ANTHROPIC_API_KEY=your_anthropic_key

# Upstash Vector (document embeddings)
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token

# Upstash Redis (rate limiting — 3 uploads / 20 chats per IP per 24h)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Optional — Supabase for Google auth + cross-device sync
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get your Anthropic API key at [console.anthropic.com](https://console.anthropic.com).

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload any PDF.

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Add your environment variables in the Vercel dashboard
4. Click **Deploy**

After deploying, update your Supabase OAuth redirect URL to `https://your-app.vercel.app/api/auth/callback`.

---

## Security Considerations

- Documents are never written to disk or persisted server-side. Only text chunks — as vector embeddings — are stored in Upstash.
- Upstash Vector is SOC 2 Type II compliant. Data can be pinned to a specific region.
- For stricter requirements (healthcare, legal, financial services), the vector store can be swapped for a self-hosted alternative — Qdrant, Weaviate, or pgvector on Supabase — without changing the rest of the codebase. The architecture is portable by design.
- Supabase row-level security ensures each user can only access their own document metadata.

---

Built by a Marketing professional specialising in applied AI. View the full portfolio of production-grade AI marketing tools at [aiwithshireen.com](https://aiwithshireen.com) or browse more projects on [GitHub](https://github.com/shireen-mvps).
