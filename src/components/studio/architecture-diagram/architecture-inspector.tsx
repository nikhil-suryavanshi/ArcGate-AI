"use client";

import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import type { ArchEdge, ArchNode } from "./map-architecture";

type ArchitectureInspectorProps = {
  node: ArchNode;
  nodes: ArchNode[];
  edges: ArchEdge[];
  onClose: () => void;
};

export function ArchitectureInspector({ node, nodes, edges, onClose }: ArchitectureInspectorProps) {
  const outgoing = edges
    .filter((edge) => edge.from === node.id)
    .map((edge) => nodes.find((item) => item.id === edge.to)?.name)
    .filter((name): name is string => Boolean(name));
  const related = edges
    .filter((edge) => edge.from === node.id || edge.to === node.id)
    .map((edge) => {
      const otherId = edge.from === node.id ? edge.to : edge.from;
      return nodes.find((item) => item.id === otherId);
    })
    .filter((item): item is ArchNode => item != null && item.kind === "external")
    .map((item) => item.name);

  const fields = [
    { label: "Name", value: node.name },
    { label: "Category", value: node.category },
    { label: "Responsibility", value: node.responsibilities },
    { label: "Interfaces", value: node.interfaces.join(" · ") },
    { label: "Dependencies", value: outgoing.join(" · ") },
    { label: "Related systems", value: related.join(" · ") },
    { label: "Technology", value: node.technology.join(" · ") },
  ].filter((field) => field.value);

  return (
    <aside className="flex h-full w-full flex-col border-l border-hairline bg-inspector backdrop-blur-md">
      <div className="flex items-start justify-between gap-3 border-b border-hairline px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Component</p>
          <p className="mt-1 text-[14px] font-medium tracking-tight">{node.name}</p>
        </div>
        <Button type="button" size="icon-sm" variant="ghost" onClick={onClose} aria-label="Close inspector">
          <XIcon />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">{field.label}</p>
            <p className="mt-1 text-[13px] leading-5 text-foreground/90">{field.value}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
