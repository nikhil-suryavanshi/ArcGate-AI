"use client";

import { Badge } from "@/components/ui/badge";
import type { AppLayerId, AppModule, ArchitectureLayer } from "@/lib/types";

const LAYER_ORDER: AppLayerId[] = [
  "presentation",
  "api",
  "domain",
  "data",
  "integration",
  "cross-cutting",
];

const LAYER_META: Record<AppLayerId, { label: string; caption: string }> = {
  presentation: { label: "Presentation", caption: "Channels and UX of this application" },
  api: { label: "API", caption: "Application APIs and BFFs" },
  domain: { label: "Domain", caption: "Application modules and business rules" },
  data: { label: "Data", caption: "Persistence owned by this application" },
  integration: { label: "Integration", caption: "Outbound adapters to other systems" },
  "cross-cutting": { label: "Cross-cutting", caption: "Identity, observability, and policy inside the app" },
};

type AppArchitectureViewProps = {
  layers: ArchitectureLayer[];
  modules: AppModule[];
};

function inferLayerId(name: string): AppLayerId {
  const raw = name.toLowerCase();
  if (raw.includes("present") || raw.includes("ui") || raw.includes("channel") || raw.includes("experience")) {
    return "presentation";
  }
  if (raw.includes("api") || raw.includes("bff") || raw.includes("gateway")) return "api";
  if (raw.includes("domain") || raw.includes("module") || raw.includes("business")) return "domain";
  if (raw.includes("data") || raw.includes("persist") || raw.includes("store")) return "data";
  if (raw.includes("integrat") || raw.includes("adapter") || raw.includes("external")) {
    return "integration";
  }
  if (raw.includes("cross") || raw.includes("security") || raw.includes("observ")) {
    return "cross-cutting";
  }
  return "domain";
}

export function AppArchitectureView({ layers, modules }: AppArchitectureViewProps) {
  const grouped = LAYER_ORDER.map((id) => {
    const layerModules = modules.filter((module) => module.layer === id);
    const matchingLayers = layers.filter((layer) => inferLayerId(layer.name) === id);
    const components = [
      ...layerModules.map((module) => module.name),
      ...matchingLayers.flatMap((layer) => layer.components),
    ].filter((item, index, all) => all.indexOf(item) === index);
    const responsibilities =
      layerModules[0]?.responsibilities ||
      matchingLayers[0]?.responsibilities ||
      LAYER_META[id].caption;
    return { id, components, responsibilities };
  }).filter((row) => row.components.length || row.id !== "cross-cutting");

  return (
    <div className="rounded-xl border border-hairline bg-card/60 p-5 sm:p-6">
      <p className="text-[13px] font-medium">App architecture</p>
      <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
        Internal structure of the application — presentation through integrations.
      </p>
      <div className="mt-5 space-y-2">
        {grouped.map((row, index) => (
          <div key={row.id} className="relative">
            {index < grouped.length - 1 ? (
              <div className="absolute top-full left-6 z-0 h-2 w-px bg-hairline-strong" />
            ) : null}
            <div className="relative rounded-lg border border-hairline bg-raised px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-medium">{LAYER_META[row.id].label}</p>
                <span className="text-[11px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{row.responsibilities}</p>
              {row.components.length ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {row.components.map((component) => (
                    <Badge key={component} variant="outline">
                      {component}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
