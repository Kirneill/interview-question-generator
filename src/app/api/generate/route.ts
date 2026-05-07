import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobTitle } = body;

    if (!jobTitle || typeof jobTitle !== "string" || jobTitle.trim() === "") {
      return Response.json(
        { error: "jobTitle is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      system:
        "You are an expert interviewer. Given a job title, generate exactly 3 thoughtful interview questions specific to that role. Questions should assess both technical competence and soft skills relevant to the position. Return ONLY a valid JSON array of 3 strings. No markdown, no numbering, no explanation, no extra text.",
      prompt: jobTitle.trim(),
    });

    const questions: string[] = JSON.parse(text);

    if (!Array.isArray(questions) || questions.length !== 3) {
      return Response.json(
        { error: "Failed to generate valid interview questions" },
        { status: 500 }
      );
    }

    return Response.json({ questions });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    return Response.json(
      { error: "Failed to generate interview questions" },
      { status: 500 }
    );
  }
}
