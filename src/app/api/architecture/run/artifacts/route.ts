import { NextResponse } from "next/server";
import { normalizeResult } from "@/lib/normalize";
import { createApprovedArtifacts, serverOpenAIKey } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const apiKey =
      (typeof body.openaiApiKey === "string" ? body.openaiApiKey.trim() : "") || serverOpenAIKey();

    if (!apiKey) {
      return NextResponse.json({ error: "Add an OpenAI API key to create artefacts." }, { status: 400 });
    }
    if (!body.result || typeof body.result !== "object") {
      return NextResponse.json({ error: "An approved architecture result is required." }, { status: 400 });
    }

    const artifact = await createApprovedArtifacts(normalizeResult(body.result), apiKey);
    return NextResponse.json({ artifact });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create approved artefacts" },
      { status: 400 },
    );
  }
}
