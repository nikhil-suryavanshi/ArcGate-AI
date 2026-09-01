"use client";

import { CableIcon, DatabaseIcon, DiamondIcon, MoveRightIcon, SquareIcon } from "lucide-react";

const ITEMS = [
  { icon: SquareIcon, label: "Application" },
  { icon: DiamondIcon, label: "External system" },
  { icon: DatabaseIcon, label: "Data store" },
  { icon: CableIcon, label: "Adapter" },
  { icon: MoveRightIcon, label: "Dependency" },
] as const;

export function ArchitectureLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
      {ITEMS.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <item.icon className="size-3" />
          {item.label}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span className="w-4 border-t border-dashed border-edge-strong" />
        Event
      </li>
    </ul>
  );
}
