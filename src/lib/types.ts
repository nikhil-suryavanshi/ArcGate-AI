export type Priority = "must" | "should" | "could";

export type ArchitectureBrief = {
  title?: string;
  businessContext: string;
  industry: string;
  constraints: string[];
  scale: string;
  existingSystems: string;
  architectureStyle: string;
};

export type FunctionalRequirement = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
};

export type NonFunctionalRequirement = {
  id: string;
  category: string;
  requirement: string;
  target: string;
};

export type ArchitectureLayer = {
  name: string;
  components: string[];
  responsibilities: string;
};

export type TechChoice = {
  layer: string;
  choices: string[];
  why: string;
};

export type AppModule = {
  name: string;
  layer: AppLayerId;
  responsibilities: string;
  interfaces: string[];
};

export type AppLayerId =
  | "presentation"
  | "api"
  | "domain"
  | "data"
  | "integration"
  | "cross-cutting";

export type ApplicationArchitecture = {
  overview: string;
  style: string;
  styleId: string;
  styleRationale: string;
  layers: ArchitectureLayer[];
  modules: AppModule[];
  dataFlow: string;
  mermaid: string;
  techStack: TechChoice[];
  integrationPoints: string[];
};

export type ArchitectureResult = {
  title: string;
  proposedSolution: string;
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  applicationArchitecture: ApplicationArchitecture;
  assumptions: string[];
};

export type AnalyzeResponse = {
  source: "openai";
  model: string;
  result: ArchitectureResult;
};

export type AgentId = "intent" | "requirements" | "architecture" | "governance" | "package";
export type AgentStatus = "waiting" | "working" | "complete" | "review";
export type AgentHandoff = { agent: AgentId; label: string; status: AgentStatus; received: string; created: string; passedTo?: string };
export type GovernanceFinding = { severity: "high" | "medium" | "low"; title: string; evidence: string; recommendation: string };
export type ArchitectureRun = { source: "openai"; model: string; result: ArchitectureResult; handoffs: AgentHandoff[]; governance: { score: number; summary: string; findings: GovernanceFinding[]; status: "awaiting_review" | "approved" }; };
