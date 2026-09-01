import type {
  AppLayerId,
  AppModule,
  ApplicationArchitecture,
  TechChoice,
} from "@/lib/types";

export type ArchNodeKind =
  | "presentation"
  | "api"
  | "domain"
  | "data"
  | "integration"
  | "external"
  | "adapter"
  | "database"
  | "event"
  | "infrastructure";

export type ArchEdgeKind = "sync" | "async";

export type ArchNode = {
  id: string;
  name: string;
  kind: ArchNodeKind;
  lane: AppLayerId | "external";
  category: string;
  description?: string;
  responsibilities?: string;
  interfaces: string[];
  technology: string[];
};

export type ArchEdge = {
  id: string;
  from: string;
  to: string;
  kind: ArchEdgeKind;
};

export type ArchLane = {
  id: AppLayerId;
  label: string;
  caption: string;
  nodeIds: string[];
};

export type ArchitectureViewModel = {
  style: string;
  styleId: string;
  styleRationale: string;
  overview: string;
  dataFlow: string;
  techHighlights: string[];
  lanes: ArchLane[];
  splitLaneIds: AppLayerId[];
  nodes: ArchNode[];
  edges: ArchEdge[];
  externals: ArchNode[];
  hasStructuredData: boolean;
};

const LANE_ORDER: AppLayerId[] = [
  "presentation",
  "api",
  "domain",
  "data",
  "integration",
  "cross-cutting",
];

const LANE_META: Record<AppLayerId, { label: string; caption: string }> = {
  presentation: { label: "Experience", caption: "Channels and UX of this application" },
  api: { label: "Application / API", caption: "Application APIs and BFFs" },
  domain: { label: "Domain", caption: "Business capabilities" },
  data: { label: "Data", caption: "Persistence owned by this application" },
  integration: { label: "Integrations", caption: "Outbound adapters to other systems" },
  "cross-cutting": {
    label: "Cross-cutting",
    caption: "Identity, observability, and policy inside the app",
  },
};

const STOP_TOKENS = new Set([
  "service",
  "services",
  "api",
  "apis",
  "module",
  "modules",
  "system",
  "systems",
  "data",
  "application",
  "platform",
  "layer",
  "interface",
  "client",
  "server",
  "app",
  "core",
  "domain",
  "adapter",
  "gateway",
  "store",
  "database",
]);

const ASYNC_PATTERN = /event|queue|topic|stream|pubsub|publish|subscribe|async|message bus|webhook/i;

export function mapArchitecture(architecture: ApplicationArchitecture): ArchitectureViewModel {
  const nodesByKey = new Map<string, ArchNode>();

  for (const appModule of architecture.modules) {
    const node = moduleToNode(appModule, architecture.techStack);
    upsertNode(nodesByKey, node);
  }

  for (const layer of architecture.layers) {
    const lane = inferLayerId(layer.name);
    for (const component of layer.components) {
      const key = normalizeKey(component);
      if (!key || nodesByKey.has(key)) continue;
      upsertNode(
        nodesByKey,
        createNode({
          name: component,
          lane,
          kind: classifyKind(component, lane),
          responsibilities: layer.responsibilities,
          interfaces: [],
          technology: techFor(component, lane, architecture.techStack),
        })
      );
    }
  }

  for (const point of architecture.integrationPoints) {
    const key = normalizeKey(point);
    if (!key) continue;
    const existing = nodesByKey.get(key);
    if (existing && existing.lane !== "external") continue;
    upsertNode(
      nodesByKey,
      createNode({
        name: point,
        lane: "external",
        kind: "external",
        interfaces: [],
        technology: [],
      })
    );
  }

  const nodes = [...nodesByKey.values()];
  const internalsByLane = new Map<AppLayerId, ArchNode[]>();
  for (const id of LANE_ORDER) internalsByLane.set(id, []);
  for (const node of nodes) {
    if (node.lane === "external") continue;
    internalsByLane.get(node.lane)?.push(node);
  }

  const lanes: ArchLane[] = LANE_ORDER.filter((id) => (internalsByLane.get(id)?.length ?? 0) > 0).map(
    (id) => {
      const source = architecture.layers.find((layer) => inferLayerId(layer.name) === id);
      return {
        id,
        label: source?.name?.trim() || LANE_META[id].label,
        caption: oneLine(source?.responsibilities, 200) || LANE_META[id].caption,
        nodeIds: (internalsByLane.get(id) ?? []).map((node) => node.id),
      };
    }
  );

  const externals = nodes.filter((node) => node.kind === "external");
  const edges = inferEdges(nodes);
  const hasData = lanes.some((lane) => lane.nodeIds.length > 0);
  const splitLaneIds = (["data", "integration"] as AppLayerId[]).filter((id) =>
    lanes.some((lane) => lane.id === id)
  );

  return {
    style: architecture.style,
    styleId: architecture.styleId,
    styleRationale: architecture.styleRationale,
    overview: architecture.overview,
    dataFlow: architecture.dataFlow,
    techHighlights: unique(architecture.techStack.flatMap((stack) => stack.choices)).slice(0, 3),
    lanes,
    splitLaneIds: splitLaneIds.length === 2 ? splitLaneIds : [],
    nodes,
    edges,
    externals,
    hasStructuredData: hasData,
  };
}

function moduleToNode(module: AppModule, techStack: TechChoice[]): ArchNode {
  const kind = classifyKind(module.name, module.layer, module.interfaces);
  return createNode({
    name: module.name,
    lane: module.layer,
    kind,
    responsibilities: module.responsibilities,
    interfaces: module.interfaces,
    technology: techFor(module.name, module.layer, techStack),
  });
}

function createNode(input: {
  name: string;
  lane: AppLayerId | "external";
  kind: ArchNodeKind;
  responsibilities?: string;
  interfaces: string[];
  technology: string[];
}): ArchNode {
  return {
    id: `${input.lane}:${normalizeKey(input.name).replace(/\s+/g, "-")}`,
    name: input.name,
    kind: input.kind,
    lane: input.lane,
    category: categoryLabel(input.kind),
    description: oneLine(input.responsibilities),
    responsibilities: input.responsibilities?.trim() || undefined,
    interfaces: unique(input.interfaces.map((item) => item.trim()).filter(Boolean)),
    technology: unique(input.technology),
  };
}

function upsertNode(store: Map<string, ArchNode>, node: ArchNode) {
  const key = normalizeKey(node.name);
  const existing = store.get(key);
  if (!existing) {
    store.set(key, node);
    return;
  }
  store.set(key, {
    ...existing,
    responsibilities: existing.responsibilities || node.responsibilities,
    description: existing.description || node.description,
    interfaces: unique([...existing.interfaces, ...node.interfaces]),
    technology: unique([...existing.technology, ...node.technology]),
  });
}

function inferEdges(nodes: ArchNode[]): ArchEdge[] {
  const edges: ArchEdge[] = [];
  const seen = new Set<string>();

  function add(from: ArchNode, to: ArchNode, kind: ArchEdgeKind) {
    if (from.id === to.id) return;
    const id = `${from.id}->${to.id}`;
    if (seen.has(id)) return;
    seen.add(id);
    edges.push({ id, from: from.id, to: to.id, kind });
  }

  for (const source of nodes) {
    if (source.lane === "external") continue;
    const haystack = [source.name, ...source.interfaces];
    for (const target of nodes) {
      if (source.id === target.id) continue;
      if (!confidentMatch(haystack, target)) continue;
      add(source, target, isAsync(haystack, target) ? "async" : "sync");
    }
  }

  return edges;
}

function confidentMatch(phrases: string[], target: ArchNode): boolean {
  return phrases.some((phrase) => namesAlign(phrase, target.name));
}

function namesAlign(left: string, right: string): boolean {
  const a = normalizeKey(left);
  const b = normalizeKey(right);
  if (!a || !b || a === b) return a === b && a.length >= 5;
  if (a.length >= 6 && b.length >= 6 && (a.includes(b) || b.includes(a))) {
    const shorter = a.length < b.length ? a : b;
    return meaningfulTokens(shorter).length > 0;
  }
  const leftTokens = meaningfulTokens(a);
  const rightTokens = new Set(meaningfulTokens(b));
  if (!leftTokens.length || !rightTokens.size) return false;
  const overlap = leftTokens.filter((token) => rightTokens.has(token));
  return overlap.length >= 1 && overlap.join("").length >= 6;
}

function meaningfulTokens(value: string): string[] {
  return value
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_TOKENS.has(token));
}

function isAsync(phrases: string[], target: ArchNode): boolean {
  return [...phrases, target.name, target.category].some((item) => ASYNC_PATTERN.test(item));
}

function classifyKind(
  name: string,
  lane: AppLayerId,
  interfaces: string[] = []
): ArchNodeKind {
  const raw = `${name} ${interfaces.join(" ")}`.toLowerCase();
  if (lane === "cross-cutting") return "infrastructure";
  if (lane === "integration") return "adapter";
  if (lane === "data") return ASYNC_PATTERN.test(raw) ? "event" : "database";
  if (lane === "presentation") return "presentation";
  if (lane === "api") return "api";
  return "domain";
}

function categoryLabel(kind: ArchNodeKind): string {
  switch (kind) {
    case "presentation":
      return "Experience";
    case "api":
      return "Application API";
    case "domain":
      return "Domain capability";
    case "data":
      return "Data";
    case "database":
      return "Data store";
    case "integration":
      return "Integration";
    case "adapter":
      return "Adapter";
    case "external":
      return "External system";
    case "event":
      return "Event / async";
    case "infrastructure":
      return "Infrastructure";
  }
}

function techFor(name: string, lane: AppLayerId | "external", techStack: TechChoice[]): string[] {
  const nameKey = normalizeKey(name);
  const laneKey = lane === "external" ? "" : lane;
  const matched: string[] = [];
  for (const stack of techStack) {
    const layerKey = normalizeKey(stack.layer);
    if (nameKey && (layerKey === nameKey || namesAlign(stack.layer, name))) {
      matched.push(...stack.choices);
      continue;
    }
    if (laneKey && (layerKey === laneKey || layerKey.includes(laneKey) || laneKey.includes(layerKey))) {
      matched.push(...stack.choices);
    }
  }
  return unique(matched);
}

export function inferLayerId(name: string): AppLayerId {
  const raw = name.toLowerCase();
  if (
    raw.includes("present") ||
    raw.includes("experience") ||
    raw.includes("channel") ||
    raw.includes("ui") ||
    raw.includes("web") ||
    raw.includes("mobile")
  ) {
    return "presentation";
  }
  if (raw.includes("api") || raw.includes("bff") || raw.includes("gateway") || raw.includes("application")) {
    return "api";
  }
  if (raw.includes("domain") || raw.includes("business") || raw.includes("capability")) return "domain";
  if (raw.includes("data") || raw.includes("persist") || raw.includes("store") || raw.includes("database")) {
    return "data";
  }
  if (raw.includes("integrat") || raw.includes("adapter") || raw.includes("external")) return "integration";
  if (raw.includes("cross") || raw.includes("security") || raw.includes("observ") || raw.includes("identity")) {
    return "cross-cutting";
  }
  return "domain";
}

function oneLine(value?: string, limit = 88): string | undefined {
  if (!value) return undefined;
  const sentence = value.replace(/\s+/g, " ").trim();
  if (!sentence) return undefined;
  const clipped = sentence.split(/(?<=\.)\s/)[0] ?? sentence;
  return clipped.length > limit ? `${clipped.slice(0, limit - 3).trimEnd()}…` : clipped;
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

export function nodeById(nodes: ArchNode[], id: string): ArchNode | undefined {
  return nodes.find((node) => node.id === id);
}

export function connectedIds(edges: ArchEdge[], id: string): Set<string> {
  const related = new Set<string>([id]);
  for (const edge of edges) {
    if (edge.from === id) related.add(edge.to);
    if (edge.to === id) related.add(edge.from);
  }
  return related;
}
