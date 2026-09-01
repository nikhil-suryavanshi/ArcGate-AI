"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExpandIcon, ListIcon, Maximize2Icon, RotateCcwIcon, ScanIcon, SearchIcon } from "lucide-react";

type ArchitectureToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  view: "diagram" | "list";
  onViewChange: (view: "diagram" | "list") => void;
  fullscreen: boolean;
  onFit: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
};

export function ArchitectureToolbar({
  query,
  onQueryChange,
  view,
  onViewChange,
  fullscreen,
  onFit,
  onReset,
  onToggleFullscreen,
}: ArchitectureToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search architecture"
          className="h-8 bg-background/40 pl-8 text-[13px]"
        />
      </div>
      <div className="flex items-center gap-1">
        <ToolButton label="Diagram" active={view === "diagram"} onClick={() => onViewChange("diagram")}>
          <ScanIcon />
        </ToolButton>
        <ToolButton label="List" active={view === "list"} onClick={() => onViewChange("list")}>
          <ListIcon />
        </ToolButton>
        <ToolButton label="Fit to view" onClick={onFit}>
          <Maximize2Icon />
        </ToolButton>
        <ToolButton label="Reset view" onClick={onReset}>
          <RotateCcwIcon />
        </ToolButton>
        <ToolButton label={fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={onToggleFullscreen}>
          <ExpandIcon />
        </ToolButton>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant={active ? "secondary" : "ghost"}
            onClick={onClick}
            aria-label={label}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
