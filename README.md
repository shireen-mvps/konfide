# AI Doc Chat

> Upload any PDF. Ask it anything. Get answers with source citations.

A full-stack RAG (Retrieval-Augmented Generation) app built with **Next.js 15**, **Vercel AI SDK**, **Claude AI**, and **Upstash Vector**. Upload a PDF, and Claude answers your questions by retrieving the most relevant sections — with source citations shown for every response.

**Live demo:** [your-app.vercel.app](https://your-app.vercel.app) <!-- update after deploy -->

---

## Why RAG — Not Just "Upload to ChatGPT"

Most people assume you can solve this by uploading a PDF to Claude.ai or ChatGPT. For small files, you can. But that approach hits hard limits fast — and it's not something a company can own, deploy, or scale.

Here's what's different about building a proper RAG pipeline:

| | Upload to Claude.ai / ChatGPT | This RAG pipeline |
|---|---|---|
| Document size limit | ~200k tokens (~300 pages) | Unlimited — only relevant chunks are retrieved |
| Cost per query | High — entire doc sent every time | Low — only top 4 relevant chunks used |
| Works across many documents | No | Yes — each gets its own isolated namespace |
| Persistent storage | No — lost when session ends | Yes — indexed until replaced |
| Customisable | No | Yes — chunking, retrieval, prompts, scoring |
| Deployable by a company | No | Yes — fully ownable pipeline |

**This is the architecture behind real enterprise tools** — internal knowledge bases, HR policy bots, legal document search, customer support over product manuals. Companies don't want someone who can use ChatGPT. They want someone who can build and own the pipeline.

---

## Real-World Use Cases

This pattern works for any organisation that needs staff or customers to query documents without reading them manually:

- **HR teams** — employee handbooks, leave policies, onboarding guides
- **Legal** — contract review, clause lookup, compliance documents
- **Customer support** — product manuals, FAQs, return policies
- **Finance** — annual reports, audit documents, regulatory filings
- **Retail / F&B** — menus, product catalogs, ingredient lists

---

## Privacy & Data Considerations

Document text is chunked and stored as **vector embeddings** in Upstash Vector — mathematical representations of meaning, not raw readable text. Upstash is SOC 2 compliant and data stays in your chosen region.

For organisations with stricter data requirements (healthcare, legal, finance), the vector store can be swapped for a self-hosted alternative (Qdrant, Weaviate, pgvector on Supabase) without changing any other part of the codebase. The architecture is designed to be portable.

---

## How It Works

1. **Upload** — You drop in a PDF (menu, catalog, report, policy, manual)
2. **Process** — The app extracts text, splits it into overlapping chunks
3. **Index** — Chunks are embedded and stored in Upstash Vector (isolated by document)
4. **Chat** — Your question is embedded and matched to the top 4 relevant chunks
5. **Answer** — Claude generates a grounded response using only those chunks
6. **Cite** — Source excerpts are shown with a relevance score beneath each answer

---

## Key Features

- **Drag-and-drop PDF upload** with live step-by-step progress indicator
- **Multi-document library** — upload multiple PDFs and switch between them; each keeps its own chat history
- **Namespace isolation** — each document gets its own vector namespace, no cross-contamination
- **Source citations** — every AI response shows the retrieved chunks with relevance scores
- **Streaming responses** — answers appear word by word via Vercel AI SDK
- **Suggested questions** — auto-prompts after upload to guide first-time users
- **Session persistence** — documents and chat history survive page refresh via localStorage
- **Export transcript** — download any chat as a markdown file

---

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Framework    | Next.js 15 (App Router)                 |
| AI Model     | Claude claude-sonnet-4-6 (Anthropic)    |
| AI SDK       | Vercel AI SDK v4 + @ai-sdk/anthropic    |
| Vector Store | Upstash Vector (with built-in embedding)|
| PDF Parsing  | pdf-parse                               |
| Styling      | Tailwind CSS v3                         |
| Language     | TypeScript                              |
| Deployment   | Vercel (free tier)                      |

---

## Project Structure

```
ai-doc-chat/
├── app/
│   ├── api/
│   │   ├── upload/route.ts        # Parse PDF → chunk → embed → upsert to Upstash
│   │   └── chat/route.ts          # Query Upstash → stream Claude response + sources
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Thin composition layer — layout only
├── components/
│   ├── UploadZone.tsx             # Drag-drop upload UI with step progress indicator
│   ├── ChatMessage.tsx            # Message rendering with markdown + source citations
│   └── DocumentLibrary.tsx        # Multi-doc switcher sidebar
├── hooks/
│   ├── useDocSession.ts           # All state, upload logic, and localStorage persistence
│   └── useSources.ts              # Extracts source citations from AI stream data
├── lib/
│   ├── chunker.ts                 # Text chunking with sentence-boundary splitting
│   ├── storage.ts                 # localStorage helpers and session types
│   └── upstash.ts                 # Upstash Vector client
├── types/
│   └── index.ts                   # Shared TypeScript types
├── .env.local.example
└── README.md
```

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/shireen-mvps/ai-doc-chat.git
cd ai-doc-chat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your Upstash Vector index

1. Go to [console.upstash.com](https://console.upstash.com) → **Vector** → **Create Index**
2. Choose **Dense** type with a built-in embedding model (e.g. `BAAI/bge-small-en-v1.5`)
3. Copy your **REST URL** and **REST Token**

### 4. Add environment variables

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`:

```
ANTHROPIC_API_KEY=your_anthropic_key
UPSTASH_VECTOR_REST_URL=your_upstash_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_token
```

Get your Anthropic key at [console.anthropic.com](https://console.anthropic.com).

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload any PDF.

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import repo
3. Add all three environment variables:
   - `ANTHROPIC_API_KEY`
   - `UPSTASH_VECTOR_REST_URL`
   - `UPSTASH_VECTOR_REST_TOKEN`
4. Click **Deploy**

---

Built by [Shireen](https://github.com/shireen-mvps)
