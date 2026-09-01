import { NextResponse } from "next/server";
import { generateArchitecture, serverOpenAIKey } from "@/lib/openai";
import type { AgentHandoff, ArchitectureBrief, ArchitectureRun, GovernanceFinding } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

function brief(body: Record<string, unknown>): ArchitectureBrief {
  const businessContext = typeof body.businessContext === "string" ? body.businessContext.trim() : "";
  if (businessContext.length < 40) throw new Error("Describe the business problem in more detail (at least a short paragraph).");
  return { title: typeof body.title === "string" ? body.title : "", businessContext, industry: typeof body.industry === "string" ? body.industry : "Other", constraints: Array.isArray(body.constraints) ? body.constraints.filter((item): item is string => typeof item === "string") : [], scale: typeof body.scale === "string" ? body.scale : "Enterprise", existingSystems: typeof body.existingSystems === "string" ? body.existingSystems : "", architectureStyle: typeof body.architectureStyle === "string" ? body.architectureStyle : "recommend" };
}

function governance(result: Awaited<ReturnType<typeof generateArchitecture>>["result"]): { score: number; summary: string; findings: GovernanceFinding[] } {
  const findings: GovernanceFinding[] = [];
  const nfrs = result.nonFunctionalRequirements.map((item) => item.category.toLowerCase()).join(" ");
  if (!/security|privacy|compliance/.test(nfrs)) findings.push({ severity: "high", title: "Security evidence is incomplete", evidence: "No explicit security, privacy, or compliance NFR was generated.", recommendation: "Confirm identity, access control, audit, and data-protection requirements." });
  if (!/observability/.test(nfrs)) findings.push({ severity: "medium", title: "Operational visibility needs validation", evidence: "No measurable observability target was found.", recommendation: "Add logging, monitoring, alerting, and service-level objectives." });
  if (!result.assumptions.length) findings.push({ severity: "medium", title: "Assumptions are missing", evidence: "The proposal has no declared assumptions.", recommendation: "Capture delivery, data, and integration assumptions before approval." });
  const score = Math.max(45, 92 - findings.reduce((total, item) => total + (item.severity === "high" ? 18 : 8), 0));
  return { score, findings, summary: findings.length ? "Review the findings and either resolve them or approve with a recorded exception." : "No blocking gaps were detected. Confirm the proposal before creating artefacts." };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const apiKey = (typeof body.openaiApiKey === "string" ? body.openaiApiKey.trim() : "") || serverOpenAIKey();
    if (!apiKey) return NextResponse.json({ error: "Add an OpenAI API key to start the agent workflow." }, { status: 400 });
    const input = brief(body);
    const intent = `Business outcome: ${input.businessContext.slice(0, 220)}`;
    const requirements = `Industry: ${input.industry}; scale: ${input.scale}; constraints: ${input.constraints.join(", ") || "none stated"}.`;
    const { result, model } = await generateArchitecture(input, apiKey);
    const review = governance(result);
    const handoffs: AgentHandoff[] = [
      { agent: "intent", label: "Intent Analyst", status: "complete", received: "Business brief", created: intent, passedTo: "Requirements Engineer" },
      { agent: "requirements", label: "Requirements Engineer", status: "complete", received: intent, created: `${result.functionalRequirements.length} functional and ${result.nonFunctionalRequirements.length} quality requirements`, passedTo: "Application Architect" },
      { agent: "architecture", label: "Application Architect", status: "complete", received: requirements, created: `${result.applicationArchitecture.style} application blueprint`, passedTo: "Governance Reviewer" },
      { agent: "governance", label: "Governance Reviewer", status: "review", received: "Requirements and architecture draft", created: `${review.score}/100 governance score with ${review.findings.length} finding(s)`, passedTo: "Human Architecture Review" },
      { agent: "package", label: "Package Writer", status: "waiting", received: "Approved proposal", created: "Will create versioned artefacts after approval" },
    ];
    const payload: ArchitectureRun = { source: "openai", model, result, handoffs, governance: { ...review, status: "awaiting_review" } };
    return NextResponse.json(payload);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to run agent workflow" }, { status: 400 }); }
}
