# Interview Question Generator

A web app that generates role-specific interview questions using AI.

## How It Works

- Enter a job title (e.g., "Customer Success Manager")
- The app calls Gemini 2.0 Flash (via OpenRouter) to generate 3 tailored interview questions
- Questions assess both technical competence and soft skills for the role

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Vercel AI SDK with OpenRouter (Gemini 2.0 Flash)
- Tailwind CSS v4

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenRouter API key (free at https://openrouter.ai/keys)

### Setup

```bash
git clone https://github.com/Kirneill/interview-question-generator.git
cd interview-question-generator
npm install
cp .env.local.example .env.local
# Add your API key to .env.local
npm run dev
```

Open http://localhost:3000

## Design Decisions

- **Gemini 2.0 Flash via OpenRouter** -- Free tier, fast inference, good enough quality for structured Q&A generation
- **Vercel AI SDK** -- Provider-agnostic abstraction; swapping to a different model is a one-line change
- **Server-side API route** -- Keeps the API key off the client; the browser never sees it
- **JSON-constrained prompting** -- System prompt enforces a pure JSON array response, validated server-side before returning to the client

## Deployment

Deploy to Vercel with one click -- the only config needed is setting `OPENROUTER_API_KEY` as an environment variable.

## Live Demo

https://interview-question-generator-woad.vercel.app
