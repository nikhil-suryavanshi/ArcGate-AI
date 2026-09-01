import { NextResponse } from "next/server";
import { runArchitectureWorkflow, serverOpenAIKey } from "@/lib/openai";
import type { ArchitectureBrief } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 240;

function parseBrief(body: Record<string, unknown>): ArchitectureBrief {
  const businessContext = typeof body.businessContext === "string" ? body.businessContext.trim() : "";
  if (businessContext.length < 40) {
    throw new Error("Describe the business problem in more detail (at least a short paragraph).");
  }

  return {
    title: typeof body.title === "string" ? body.title : "",
    businessContext,
    industry: typeof body.industry === "string" ? body.industry : "Other",
    constraints: Array.isArray(body.constraints)
      ? body.constraints.filter((item): item is string => typeof item === "string")
      : [],
    scale: typeof body.scale === "string" ? body.scale : "Enterprise",
    existingSystems: typeof body.existingSystems === "string" ? body.existingSystems : "",
    architectureStyle: typeof body.architectureStyle === "string" ? body.architectureStyle : "recommend",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const apiKey =
      (typeof body.openaiApiKey === "string" ? body.openaiApiKey.trim() : "") || serverOpenAIKey();

    if (!apiKey) {
      return NextResponse.json({ error: "Add an OpenAI API key to start the agent workflow." }, { status: 400 });
    }

    return NextResponse.json(await runArchitectureWorkflow(parseBrief(body), apiKey));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run agent workflow" },
      { status: 400 },
    );
  }
}
