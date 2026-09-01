import "server-only";

import OpenAI from "openai";
import { extractJson, normalizeResult } from "./normalize";
import type {
  AgentArtifact,
  AgentHandoff,
  ArchitectureBrief,
  ArchitectureResult,
  ArchitectureRun,
  GovernanceFinding,
  GovernanceReview,
  IntentAnalysis,
  RequirementsAnalysis,
} from "./types";

export const DEFAULT_OPENAI_MODEL = "gpt-5.6-sol";

type JsonSchema = Record<string, unknown>;
type AgentCall<T> = { value: T; model: string };

const functionalRequirementSchema: JsonSchema = {
  type: "object", additionalProperties: false, required: ["id", "title", "description", "priority"],
  properties: { id: { type: "string" }, title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["must", "should", "could"] } },
};

const nonFunctionalRequirementSchema: JsonSchema = {
  type: "object", additionalProperties: false, required: ["id", "category", "requirement", "target"],
  properties: { id: { type: "string" }, category: { type: "string" }, requirement: { type: "string" }, target: { type: "string" } },
};

const applicationArchitectureSchema: JsonSchema = {
  type: "object", additionalProperties: false,
  required: ["overview", "style", "styleId", "styleRationale", "layers", "modules", "dataFlow", "mermaid", "techStack", "integrationPoints"],
  properties: {
    overview: { type: "string" }, style: { type: "string" },
    styleId: { type: "string", enum: ["layered", "modular-monolith", "hexagonal", "microservices", "event-driven", "cqrs", "serverless", "lcnc-runtime"] },
    styleRationale: { type: "string" },
    layers: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "components", "responsibilities"], properties: { name: { type: "string" }, components: { type: "array", items: { type: "string" } }, responsibilities: { type: "string" } } } },
    modules: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "layer", "responsibilities", "interfaces"], properties: { name: { type: "string" }, layer: { type: "string", enum: ["presentation", "api", "domain", "data", "integration", "cross-cutting"] }, responsibilities: { type: "string" }, interfaces: { type: "array", items: { type: "string" } } } } },
    dataFlow: { type: "string" }, mermaid: { type: "string" },
    techStack: { type: "array", items: { type: "object", additionalProperties: false, required: ["layer", "choices", "why"], properties: { layer: { type: "string" }, choices: { type: "array", items: { type: "string" } }, why: { type: "string" } } } },
    integrationPoints: { type: "array", items: { type: "string" } },
  },
};

const intentSchema: JsonSchema = {
  type: "object", additionalProperties: false, required: ["summary", "outcomes", "scope", "openQuestions"],
  properties: { summary: { type: "string" }, outcomes: { type: "array", items: { type: "string" } }, scope: { type: "string" }, openQuestions: { type: "array", items: { type: "string" } } },
};

const requirementsSchema: JsonSchema = {
  type: "object", additionalProperties: false, required: ["functionalRequirements", "nonFunctionalRequirements"],
  properties: { functionalRequirements: { type: "array", items: functionalRequirementSchema }, nonFunctionalRequirements: { type: "array", items: nonFunctionalRequirementSchema } },
};

const architectureSchema: JsonSchema = {
  type: "object", additionalProperties: false, required: ["title", "proposedSolution", "applicationArchitecture", "assumptions"],
  properties: { title: { type: "string" }, proposedSolution: { type: "string" }, applicationArchitecture: applicationArchitectureSchema, assumptions: { type: "array", items: { type: "string" } } },
};

const governanceSchema: JsonSchema = {
  type: "object", additionalProperties: false, required: ["score", "summary", "findings"],
  properties: { score: { type: "number" }, summary: { type: "string" }, findings: { type: "array", items: { type: "object", additionalProperties: false, required: ["severity", "title", "evidence", "recommendation"], properties: { severity: { type: "string", enum: ["high", "medium", "low"] }, title: { type: "string" }, evidence: { type: "string" }, recommendation: { type: "string" } } } } },
};

const artifactSchema: JsonSchema = {
  type: "object", additionalProperties: false, required: ["fileName", "markdown", "summary"],
  properties: { fileName: { type: "string" }, markdown: { type: "string" }, summary: { type: "string" } },
};

export function serverOpenAIKey(): string {
  return process.env.OPENAI_API_KEY?.trim() || "";
}

export function hasOpenAIKey(): boolean {
  return Boolean(serverOpenAIKey());
}

export function openAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

async function callAgent<T>(client: OpenAI, name: string, instructions: string, input: unknown, schema: JsonSchema): Promise<AgentCall<T>> {
  const model = openAIModel();
  const response = await client.responses.create({
    model,
    instructions,
    input: JSON.stringify(input),
    reasoning: { effort: "medium" },
    store: false,
    text: { format: { type: "json_schema", name, strict: true, schema } },
  });
  if (!response.output_text.trim()) throw new Error(`${name} returned an empty response.`);
  return { value: extractJson(response.output_text) as T, model: response.model || model };
}

function completed(agent: AgentHandoff["agent"], label: string, received: string, created: string, model: string, passedTo?: string): AgentHandoff {
  return { agent, label, status: "complete", received, created, model, passedTo };
}

export async function runArchitectureWorkflow(brief: ArchitectureBrief, apiKey: string): Promise<ArchitectureRun> {
  const client = new OpenAI({ apiKey, maxRetries: 1, timeout: 80_000 });
  const intent = await callAgent<IntentAnalysis>(
    client, "intent_analysis",
    "You are the Intent Analyst in a governed architecture workflow. Clarify the business outcome, delivery scope, success outcomes, and unanswered questions. Do not design a solution. Return only JSON.",
    { brief }, intentSchema
  );
  const requirements = await callAgent<RequirementsAnalysis>(
    client, "requirements_analysis",
    "You are the Requirements Engineer in a governed architecture workflow. Convert the supplied business brief and intent analysis into 6-10 MoSCoW functional requirements and 5-8 measurable non-functional requirements. Do not design the architecture. Return only JSON.",
    { brief, intent: intent.value }, requirementsSchema
  );
  const architecture = await callAgent<Omit<ArchitectureResult, "functionalRequirements" | "nonFunctionalRequirements">>(
    client, "application_architecture",
    "You are the Application Architect in a governed architecture workflow. Use the brief, intent analysis, and requirements to propose ONE practical application. Return a concrete architecture with Presentation, API, Domain, Data, and Integrations, plus a Mermaid diagram. Do not repeat requirements. Return only JSON.",
    { brief, intent: intent.value, requirements: requirements.value }, architectureSchema
  );
  const result = normalizeResult({ ...architecture.value, ...requirements.value });
  const governance = await callAgent<GovernanceReview>(
    client, "governance_review",
    "You are the Governance Reviewer in a governed architecture workflow. Review the supplied architecture package for security, privacy, compliance, observability, assumptions, and delivery risk. Give a 0-100 score and actionable findings. Do not redesign the solution. Return only JSON.",
    { brief, intent: intent.value, requirements: requirements.value, architecture: result }, governanceSchema
  );
  const review = normalizeGovernance(governance.value);
  const handoffs: AgentHandoff[] = [
    completed("intent", "Intent Analyst", "Business brief", intent.value.summary, intent.model, "Requirements Engineer"),
    completed("requirements", "Requirements Engineer", intent.value.summary, `${requirements.value.functionalRequirements.length} functional and ${requirements.value.nonFunctionalRequirements.length} quality requirements`, requirements.model, "Application Architect"),
    completed("architecture", "Application Architect", "Intent analysis and requirements", `${result.applicationArchitecture.style} application blueprint`, architecture.model, "Governance Reviewer"),
    { agent: "governance", label: "Governance Reviewer", status: "review", received: "Architecture package", created: `${review.score}/100 governance score with ${review.findings.length} finding(s)`, model: governance.model, passedTo: "Human Architecture Review" },
    { agent: "artifact", label: "Artefact Agent", status: "waiting", received: "Human-approved proposal", created: "Waiting for an approval decision", model: openAIModel() },
  ];
  return { runId: crypto.randomUUID(), source: "openai", model: architecture.model, result, handoffs, governance: { ...review, status: "awaiting_review" } };
}

export async function createApprovedArtifacts(result: ArchitectureResult, apiKey: string): Promise<AgentArtifact> {
  const client = new OpenAI({ apiKey, maxRetries: 1, timeout: 80_000 });
  const artifact = await callAgent<AgentArtifact>(
    client, "approved_architecture_artifact",
    "You are the Artefact Agent in a governed architecture workflow. The supplied architecture has already passed human approval. Produce one complete Markdown architecture package with the proposed solution, functional requirements, non-functional requirements, application architecture, Mermaid diagram, assumptions, and a concise approval note. Return only JSON.",
    { result }, artifactSchema
  );
  return { ...artifact.value, model: artifact.model, createdAt: new Date().toISOString() };
}

function normalizeGovernance(review: GovernanceReview): GovernanceReview {
  const findings = Array.isArray(review.findings) ? review.findings : [];
  return {
    score: Math.max(0, Math.min(100, Math.round(Number(review.score) || 0))),
    summary: review.summary || "Review the proposal before approval.",
    findings: findings.map((finding): GovernanceFinding => ({ severity: finding.severity, title: finding.title, evidence: finding.evidence, recommendation: finding.recommendation })),
  };
}
