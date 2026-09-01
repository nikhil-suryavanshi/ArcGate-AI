import { ARCHITECTURE_STYLES } from "./samples";
import type { ArchitectureBrief } from "./types";

function styleInstruction(styleId: string): string {
  const style = ARCHITECTURE_STYLES.find((item) => item.id === styleId);
  if (!styleId || styleId === "recommend" || !style) {
    return `Choose the best APPLICATION architecture style from: ${ARCHITECTURE_STYLES.filter((item) => item.id !== "recommend")
      .map((item) => item.label)
      .join("; ")}. Put the chosen style id in applicationArchitecture.styleId.`;
  }
  return `You MUST structure the APPLICATION architecture using this selected style: ${style.label} (${style.id}). ${style.hint}. Put styleId "${style.id}" on the architecture.`;
}

export const SYSTEM_INSTRUCTION = `You are ArcGate AI, a governed application architecture copilot powered by OpenAI.

From the business intent, propose ONE application and return only:
1. Functional requirements for that application (MoSCoW).
2. Non-functional requirements with measurable targets.
3. Application architecture (App Arch) for that application.
4. Assumptions.

Application architecture means the INTERNAL structure of the software application:
- Presentation / channels (web, mobile, BFF, workbenches)
- API / application services
- Domain modules (bounded application capabilities)
- Data / persistence owned by this app
- Integration adapters (how THIS app talks to other systems)

It is NOT enterprise architecture, NOT a landing zone, NOT an org-wide control plane, and NOT a list of architecture alternatives. Do not use layers named "Experience", "Governance", "Catalog", "Enterprise systems", or "Platform landing zone" unless the product itself is a low-code runtime and the selected style is Low-code application runtime.

Rules:
- Name concrete application components (e.g. ClaimsIntake API, AdjusterWorkbench UI, ReservationService).
- Layers MUST be mapped to: presentation, api, domain, data, integration, and optionally cross-cutting.
- mermaid MUST be a layered application diagram using subgraphs named Presentation, API, Domain, Data, Integrations. Start with graph TB. Quoted labels only.
- Return ONLY valid JSON. No markdown fences.`;

export function buildUserPrompt(brief: ArchitectureBrief): string {
  return `Produce an application architecture package for this business intent.\n\nTitle: ${brief.title || "(derive a concise application name)"}\nIndustry: ${brief.industry}\nScale: ${brief.scale}\nConstraints: ${brief.constraints.length ? brief.constraints.join("; ") : "none stated"}\nExisting systems: ${brief.existingSystems || "not specified"}\nApp architecture style: ${styleInstruction(brief.architectureStyle)}\n\nBusiness intent:\n${brief.businessContext}\n\nReturn JSON with exactly this shape:\n{\n  "title": "string — name of the proposed application",\n  "proposedSolution": "string — 2-4 sentences: the application we are proposing",\n  "functionalRequirements": [\n    { "id": "FR-01", "title": "string", "description": "string", "priority": "must|should|could" }\n  ],\n  "nonFunctionalRequirements": [\n    { "id": "NFR-01", "category": "availability|security|performance|scalability|observability|compliance|cost|usability", "requirement": "string", "target": "string" }\n  ],\n  "applicationArchitecture": {\n    "overview": "string — how this application is internally structured",\n    "style": "string — selected application architecture style name",\n    "styleId": "layered|modular-monolith|hexagonal|microservices|event-driven|cqrs|serverless|lcnc-runtime",\n    "styleRationale": "string — why this app-arch style fits the intent",\n    "layers": [\n      { "name": "Presentation|API|Domain|Data|Integration|Cross-cutting", "components": ["string"], "responsibilities": "string" }\n    ],\n    "modules": [\n      { "name": "string", "layer": "presentation|api|domain|data|integration|cross-cutting", "responsibilities": "string", "interfaces": ["string"] }\n    ],\n    "dataFlow": "string — primary user journey through the application layers",\n    "mermaid": "graph TB\\n  subgraph Presentation\\n    UI[\\"Web / mobile\\"]\\n  end\\n  subgraph API\\n    Svc[\\"Application API\\"]\\n  end\\n  subgraph Domain\\n    Dom[\\"Domain modules\\"]\\n  end\\n  subgraph Data\\n    DB[\\"App database\\"]\\n  end\\n  subgraph Integrations\\n    Ext[\\"External systems\\"]\\n  end\\n  UI --> Svc --> Dom --> DB\\n  Dom --> Ext",\n    "techStack": [\n      { "layer": "presentation|api|domain|data|integration", "choices": ["string"], "why": "string" }\n    ],\n    "integrationPoints": ["string — outbound adapters this application uses"]\n  },\n  "assumptions": ["string"]\n}\n\nProvide 6-10 FRs, 5-8 NFRs, all five app layers (presentation, api, domain, data, integration), 6-12 modules, and 5-8 assumptions.`;
}
