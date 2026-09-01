import type { AppLayerId, ApplicationArchitecture, ArchitectureResult, FunctionalRequirement, NonFunctionalRequirement, Priority } from "./types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => asString(item)).filter(Boolean);
}

function asPriority(value: unknown): Priority {
  return value === "should" || value === "could" ? value : "must";
}

function asLayerId(value: unknown): AppLayerId {
  const raw = asString(value).toLowerCase();
  if (raw.includes("present") || raw.includes("ui") || raw.includes("channel") || raw.includes("experience")) {
    return "presentation";
  }
  if (raw === "api" || raw.includes("bff") || raw.includes("gateway") || raw.includes("application service")) {
    return "api";
  }
  if (raw.includes("domain") || raw.includes("business") || raw.includes("module")) {
    return "domain";
  }
  if (raw.includes("data") || raw.includes("persist") || raw.includes("store")) {
    return "data";
  }
  if (raw.includes("integrat") || raw.includes("adapter") || raw.includes("external")) {
    return "integration";
  }
  if (raw.includes("cross") || raw.includes("security") || raw.includes("observ")) {
    return "cross-cutting";
  }
  return "domain";
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("The model did not return JSON.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function mapRequirements(raw: unknown, prefix: "FR" | "NFR") {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      id: asString(row.id, `${prefix}-${String(index + 1).padStart(2, "0")}`),
      title: asString(row.title, prefix === "FR" ? asString(row.requirement, "Requirement") : "Quality attribute"),
      description: asString(row.description, asString(row.requirement)),
      category: asString(row.category, "quality"),
      requirement: asString(row.requirement, asString(row.description)),
      target: asString(row.target),
      priority: asPriority(row.priority),
    };
  });
}

export function normalizeResult(raw: unknown): ArchitectureResult {
  const data = (raw ?? {}) as Record<string, unknown>;
  const intent = (data.intent ?? {}) as Record<string, unknown>;
  const recommendation = (data.recommendation ?? {}) as Record<string, unknown>;
  const blueprint = (data.blueprint ?? {}) as Record<string, unknown>;
  const architectureSource = (data.applicationArchitecture ?? blueprint) as Record<string, unknown>;

  const functionalRequirements: FunctionalRequirement[] = mapRequirements(
    data.functionalRequirements,
    "FR"
  ).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
  }));

  const nonFunctionalRequirements: NonFunctionalRequirement[] = mapRequirements(
    data.nonFunctionalRequirements,
    "NFR"
  ).map((row) => ({
    id: row.id,
    category: row.category,
    requirement: row.requirement,
    target: row.target,
  }));

  const applicationArchitecture: ApplicationArchitecture = {
    overview: asString(
      architectureSource.overview,
      asString(recommendation.rationale, asString(intent.summary))
    ),
    style: asString(architectureSource.style, "Layered application architecture"),
    layers: Array.isArray(architectureSource.layers)
      ? architectureSource.layers.map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          return {
            name: asString(row.name, "Layer"),
            components: asStringArray(row.components),
            responsibilities: asString(row.responsibilities),
          };
        })
      : [],
    dataFlow: asString(architectureSource.dataFlow),
    mermaid: asString(
      architectureSource.mermaid,
      "graph TB\n  subgraph Presentation\n    UI[\"Web / mobile\"]\n  end\n  subgraph API\n    Svc[\"Application API\"]\n  end\n  subgraph Domain\n    Dom[\"Domain modules\"]\n  end\n  subgraph Data\n    DB[\"App database\"]\n  end\n  subgraph Integrations\n    Ext[\"External systems\"]\n  end\n  UI --> Svc --> Dom --> DB\n  Dom --> Ext"
    ),
    techStack: Array.isArray(architectureSource.techStack)
      ? architectureSource.techStack.map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          return {
            layer: asString(row.layer, "Platform"),
            choices: asStringArray(row.choices),
            why: asString(row.why),
          };
        })
      : [],
    integrationPoints: asStringArray(architectureSource.integrationPoints),
    styleId: asString(architectureSource.styleId, "layered"),
    styleRationale: asString(architectureSource.styleRationale),
    modules: Array.isArray(architectureSource.modules)
      ? architectureSource.modules.map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          return {
            name: asString(row.name, "Module"),
            layer: asLayerId(row.layer),
            responsibilities: asString(row.responsibilities),
            interfaces: asStringArray(row.interfaces),
          };
        })
      : [],
  };

  if (!functionalRequirements.length) {
    throw new Error("The model response was missing functional requirements.");
  }

  return {
    title: asString(data.title, "Proposed solution"),
    proposedSolution: asString(
      data.proposedSolution,
      asString(recommendation.rationale, asString(intent.summary, applicationArchitecture.overview))
    ),
    functionalRequirements,
    nonFunctionalRequirements,
    applicationArchitecture,
    assumptions: asStringArray(data.assumptions, asStringArray(intent.assumptions)),
  };
}
