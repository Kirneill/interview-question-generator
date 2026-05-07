import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request: Request) {
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
    const { text } = await generateText({
      model: openrouter("google/gemini-2.0-flash-001"),
      system:
        "You are an expert interviewer. Given a job title, generate exactly 3 thoughtful interview questions specific to that role. Questions should assess both technical competence and soft skills relevant to the position. Return ONLY a valid JSON array of 3 strings. No markdown, no numbering, no explanation, no extra text.",
      prompt: jobTitle.trim(),
    });

    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const parsed: unknown = JSON.parse(cleaned);

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
