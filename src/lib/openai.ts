import "server-only";

import OpenAI from "openai";
import { extractJson, normalizeResult } from "./normalize";
import { buildUserPrompt, SYSTEM_INSTRUCTION } from "./prompts";
import type { ArchitectureBrief, ArchitectureResult } from "./types";

export const DEFAULT_OPENAI_MODEL = "gpt-5.6-sol";

const ARCHITECTURE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "proposedSolution",
    "functionalRequirements",
    "nonFunctionalRequirements",
    "applicationArchitecture",
    "assumptions",
  ],
  properties: {
    title: { type: "string" },
    proposedSolution: { type: "string" },
    functionalRequirements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "description", "priority"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["must", "should", "could"] },
        },
      },
    },
    nonFunctionalRequirements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "category", "requirement", "target"],
        properties: {
          id: { type: "string" },
          category: { type: "string" },
          requirement: { type: "string" },
          target: { type: "string" },
        },
      },
    },
    applicationArchitecture: {
      type: "object",
      additionalProperties: false,
      required: [
        "overview",
        "style",
        "styleId",
        "styleRationale",
        "layers",
        "modules",
        "dataFlow",
        "mermaid",
        "techStack",
        "integrationPoints",
      ],
      properties: {
        overview: { type: "string" },
        style: { type: "string" },
        styleId: {
          type: "string",
          enum: [
            "layered",
            "modular-monolith",
            "hexagonal",
            "microservices",
            "event-driven",
            "cqrs",
            "serverless",
            "lcnc-runtime",
          ],
        },
        styleRationale: { type: "string" },
        layers: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "components", "responsibilities"],
            properties: {
              name: { type: "string" },
              components: { type: "array", items: { type: "string" } },
              responsibilities: { type: "string" },
            },
          },
        },
        modules: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "layer", "responsibilities", "interfaces"],
            properties: {
              name: { type: "string" },
              layer: {
                type: "string",
                enum: ["presentation", "api", "domain", "data", "integration", "cross-cutting"],
              },
              responsibilities: { type: "string" },
              interfaces: { type: "array", items: { type: "string" } },
            },
          },
        },
        dataFlow: { type: "string" },
        mermaid: { type: "string" },
        techStack: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["layer", "choices", "why"],
            properties: {
              layer: { type: "string" },
              choices: { type: "array", items: { type: "string" } },
              why: { type: "string" },
            },
          },
        },
        integrationPoints: { type: "array", items: { type: "string" } },
      },
    },
    assumptions: { type: "array", items: { type: "string" } },
  },
} as const;

export function serverOpenAIKey(): string {
  return process.env.OPENAI_API_KEY?.trim() || "";
}

export function hasOpenAIKey(): boolean {
  return Boolean(serverOpenAIKey());
}

export function openAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export async function generateArchitecture(
  brief: ArchitectureBrief,
  apiKey: string
): Promise<{ result: ArchitectureResult; model: string }> {
  const model = openAIModel();
  const client = new OpenAI({ apiKey, maxRetries: 1, timeout: 80_000 });

  try {
    const response = await client.responses.create({
      model,
      instructions: SYSTEM_INSTRUCTION,
      input: buildUserPrompt(brief),
      reasoning: { effort: "medium" },
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "architecture_package",
          strict: true,
          schema: ARCHITECTURE_SCHEMA,
        },
      },
    });

    if (!response.output_text.trim()) {
      throw new Error("OpenAI returned an empty response.");
    }

    return {
      result: normalizeResult(extractJson(response.output_text)),
      model: response.model || model,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error("OpenAI could not produce a solution package. " + message);
  }
}
