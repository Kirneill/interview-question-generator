import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

// TALK: "I'm using OpenRouter as my AI provider. The Vercel AI SDK lets me create
// a provider instance with just a base URL and an API key from the environment.
// The key never touches the client — it stays server-side in this route handler."
//
// PROVIDER CHOICE: "I chose OpenRouter because it gives access to multiple AI models
// through a single OpenAI-compatible API. I'm using Gemini 2.0 Flash because it's fast,
// has a generous free tier, and is accurate enough for structured JSON generation.
// The key decision was using the Vercel AI SDK — it abstracts the provider layer,
// so if I wanted to switch to Claude or GPT tomorrow, I change one line."
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: Request) {
  // TALK: "First thing I do is parse the request body in its own try/catch.
  // If someone sends garbage JSON, they get a 400 immediately. This is separate
  // from the AI call error handling so the error messages are accurate."
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { jobTitle } = body;

  // TALK: "Input validation — I check for missing, wrong type, empty, and over
  // 200 characters. That length cap is a basic defense against prompt injection."
  if (!jobTitle || typeof jobTitle !== "string" || jobTitle.trim() === "") {
    return Response.json(
      { error: "jobTitle is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (jobTitle.trim().length > 200) {
    return Response.json(
      { error: "jobTitle must be under 200 characters" },
      { status: 400 }
    );
  }

  try {
    // TALK: "Here's the core call. The system prompt tells the model to return
    // exactly 3 questions as a JSON array. No markdown, no numbering, just raw JSON.
    // The generateText function from the Vercel AI SDK handles the HTTP call."
    const { text } = await generateText({
      model: openrouter("google/gemini-2.0-flash-001"),
      system:
        "You are an expert interviewer. Given a job title, generate exactly 3 thoughtful interview questions specific to that role. Questions should assess both technical competence and soft skills relevant to the position. Return ONLY a valid JSON array of 3 strings. No markdown, no numbering, no explanation, no extra text.",
      prompt: jobTitle.trim(),
    });

    // TALK: "Models sometimes wrap JSON in markdown code fences even when you tell
    // them not to. This regex strips those before parsing."
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const parsed: unknown = JSON.parse(cleaned);

    // TALK: "I parse as unknown and validate every element is a string. Not just
    // array length, but every element's type. If the model returns numbers or nulls,
    // this catches it."
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 3 ||
      !parsed.every((q): q is string => typeof q === "string" && q.trim().length > 0)
    ) {
      return Response.json(
        { error: "Failed to generate valid interview questions" },
        { status: 500 }
      );
    }

    const questions = parsed;

    return Response.json({ questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Generate error:", message);
    return Response.json(
      { error: "Failed to generate interview questions" },
      { status: 500 }
    );
  }
}
