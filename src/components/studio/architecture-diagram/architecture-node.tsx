"use client";

import type { LucideIcon } from "lucide-react";
import {
  AppWindowIcon,
  BoxesIcon,
  CableIcon,
  DatabaseIcon,
  DiamondIcon,
  RadioIcon,
  ShieldIcon,
  WaypointsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArchNode, ArchNodeKind } from "./map-architecture";

const ICONS: Record<ArchNodeKind, LucideIcon> = {
  presentation: AppWindowIcon,
  api: WaypointsIcon,
  domain: BoxesIcon,
  data: DatabaseIcon,
  database: DatabaseIcon,
  integration: CableIcon,
  adapter: CableIcon,
  external: DiamondIcon,
  event: RadioIcon,
  infrastructure: ShieldIcon,
};

type ArchitectureNodeProps = {
  node: ArchNode;
  selected: boolean;
  dimmed: boolean;
  highlighted: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
};

export function ArchitectureNode({
  node,
  selected,
  dimmed,
  highlighted,
  onSelect,
  onHover,
}: ArchitectureNodeProps) {
  const Icon = ICONS[node.kind];
  const external = node.kind === "external";

  return (
    <button
      type="button"
      data-arch-node={node.id}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "w-fit max-w-[17rem] min-w-[9.5rem] rounded-md border px-3 py-2.5 text-left transition-[border-color,background-color,opacity,box-shadow] duration-150",
        external
          ? "border-dashed border-hairline-strong bg-transparent"
          : "border-hairline bg-node",
        highlighted && !selected && "border-hairline-strong bg-node-hover",
        selected && "border-primary/55 bg-primary/8 ring-1 ring-primary/20",
        dimmed && "opacity-30"
      )}
    >
      <span className="flex items-start gap-2">
        <Icon
          className={cn(
            "mt-0.5 size-3.5 shrink-0",
            selected ? "text-primary" : "text-muted-foreground"
          )}
        />
        <span className="min-w-0">
          <span className="block text-[13px] leading-4 font-medium tracking-tight break-words text-foreground">
            {node.name}
          </span>
          <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">
            {node.category}
          </span>
        </span>
      </span>
    </button>
  );
}
