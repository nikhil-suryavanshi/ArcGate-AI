"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ApplicationArchitecture } from "@/lib/types";
import { ArrowDownIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppArchitectureView } from "../app-architecture-view";
import { MermaidDiagram } from "../mermaid-diagram";
import { ArchitectureEdges } from "./architecture-edge";
import { ArchitectureInspector } from "./architecture-inspector";
import { ArchitectureLegend } from "./architecture-legend";
import { ArchitectureNode } from "./architecture-node";
import { ArchitectureToolbar } from "./architecture-toolbar";
import {
  connectedIds,
  mapArchitecture,
  type ArchLane,
  type ArchNode,
  type ArchitectureViewModel,
} from "./map-architecture";

type ArchitectureDiagramProps = {
  title: string;
  architecture: ApplicationArchitecture;
};

export function ArchitectureDiagram({ title, architecture }: ArchitectureDiagramProps) {
  const model = useMemo(() => mapArchitecture(architecture), [architecture]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [view, setView] = useState<"diagram" | "list">("diagram");
  const [fullscreen, setFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [mermaidFailed, setMermaidFailed] = useState(false);

  const reset = useCallback(() => {
    setQuery("");
    setSelectedId(null);
    setHoveredId(null);
    setScale(1);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (selectedId) {
        setSelectedId(null);
        return;
      }
      if (fullscreen) setFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, selectedId]);

  const selected = model.nodes.find((node) => node.id === selectedId) ?? null;
  const showStructured = model.hasStructuredData && view === "diagram";
  const showMermaid = !showStructured && view === "diagram" && Boolean(architecture.mermaid) && !mermaidFailed;
  const showList = view === "list" || (!showStructured && !showMermaid);

  const shell = (
    <DiagramShell
      title={title}
      architecture={architecture}
      model={model}
      query={query}
      onQueryChange={setQuery}
      selectedId={selectedId}
      hoveredId={hoveredId}
      onSelect={setSelectedId}
      onHover={setHoveredId}
      view={view}
      onViewChange={setView}
      fullscreen={fullscreen}
      onToggleFullscreen={() => setFullscreen((value) => !value)}
      scale={scale}
      onScale={setScale}
      onReset={reset}
      selected={selected}
      showStructured={showStructured}
      showMermaid={showMermaid}
      showList={showList}
      onMermaidError={() => setMermaidFailed(true)}
    />
  );

  if (fullscreen && typeof document !== "undefined") {
    return createPortal(
      <div className="fixed inset-0 z-50 flex flex-col bg-background p-4 sm:p-6">{shell}</div>,
      document.body
    );
  }

  return shell;
}

function DiagramShell({
  title,
  architecture,
  model,
  query,
  onQueryChange,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  view,
  onViewChange,
  fullscreen,
  onToggleFullscreen,
  scale,
  onScale,
  onReset,
  selected,
  showStructured,
  showMermaid,
  showList,
  onMermaidError,
}: {
  title: string;
  architecture: ApplicationArchitecture;
  model: ArchitectureViewModel;
  query: string;
  onQueryChange: (value: string) => void;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  view: "diagram" | "list";
  onViewChange: (view: "diagram" | "list") => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  scale: number;
  onScale: (value: number) => void;
  onReset: () => void;
  selected: ArchNode | null;
  showStructured: boolean;
  showMermaid: boolean;
  showList: boolean;
  onMermaidError: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const fit = useCallback(() => {
    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (!scroll || !content) return;
    onScale(1);
    window.requestAnimationFrame(() => {
      const width = Math.max(content.scrollWidth, 1);
      const available = scroll.clientWidth - 8;
      onScale(width > available ? available / width : 1);
      scroll.scrollTo({ left: 0, top: 0 });
    });
  }, [onScale]);

  return (
    <div className={`flex min-h-0 flex-col ${fullscreen ? "h-full" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            Application architecture
          </p>
          <h3 className="font-heading mt-1 text-[1.55rem] leading-snug tracking-tight">{title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-[13px] text-foreground/80">{model.style || "Application architecture"}</p>
            {model.styleRationale ? (
              <Tooltip>
                <TooltipTrigger className="text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                  Why this style
                </TooltipTrigger>
                <TooltipContent className="max-w-sm text-left leading-5">
                  {model.styleRationale}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
        <ArchitectureToolbar
          query={query}
          onQueryChange={onQueryChange}
          view={view}
          onViewChange={onViewChange}
          fullscreen={fullscreen}
          onFit={fit}
          onReset={() => {
            onReset();
            scrollRef.current?.scrollTo({ left: 0, top: 0 });
          }}
          onToggleFullscreen={onToggleFullscreen}
        />
      </div>

      <div className={`relative mt-5 flex min-h-0 ${fullscreen ? "flex-1" : ""}`}>
        <div
          ref={scrollRef}
          className={`min-w-0 flex-1 overflow-auto rounded-lg border border-hairline bg-canvas ${
            fullscreen ? "min-h-0" : "max-h-[42rem]"
          }`}
          onClick={() => onSelect(null)}
        >
          {showStructured ? (
            <div
              ref={contentRef}
              className="origin-top-left p-5 sm:p-7"
              style={{ transform: `scale(${scale})`, width: scale === 1 ? "100%" : `${100 / scale}%` }}
            >
              <ArchitecturePoster
                title={title}
                model={model}
                query={query}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onSelect={onSelect}
                onHover={onHover}
              />
            </div>
          ) : showMermaid ? (
            <div className="p-5" onClick={(event) => event.stopPropagation()}>
              <MermaidDiagram chart={architecture.mermaid} onError={onMermaidError} />
            </div>
          ) : showList ? (
            <div className="p-5" onClick={(event) => event.stopPropagation()}>
              <AppArchitectureView layers={architecture.layers} modules={architecture.modules} />
            </div>
          ) : null}
        </div>
        {selected ? (
          <div
            className="absolute inset-y-0 right-0 z-10 w-[min(100%,19.5rem)] md:relative md:inset-auto md:w-80"
            onClick={(event) => event.stopPropagation()}
          >
            <ArchitectureInspector
              node={selected}
              nodes={model.nodes}
              edges={model.edges}
              onClose={() => onSelect(null)}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ArchitectureLegend />
      </div>

      {architecture.mermaid ? (
        <Accordion multiple={false} className="mt-2">
          <AccordionItem value="source">
            <AccordionTrigger className="text-[12px] text-muted-foreground hover:no-underline">
              View source diagram
            </AccordionTrigger>
            <AccordionContent>
              <MermaidDiagram chart={architecture.mermaid} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}

function ArchitecturePoster({
  title,
  model,
  query,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: {
  title: string;
  model: ArchitectureViewModel;
  query: string;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodesById = useMemo(
    () => new Map(model.nodes.map((node) => [node.id, node])),
    [model.nodes]
  );

  const split = new Set(model.splitLaneIds);
  const mainLanes = model.lanes.filter((lane) => lane.id !== "cross-cutting" && !split.has(lane.id));
  const splitLanes = model.lanes.filter((lane) => split.has(lane.id));
  const footerLane = model.lanes.find((lane) => lane.id === "cross-cutting");
  const focusId = selectedId ?? hoveredId;
  const related = focusId ? connectedIds(model.edges, focusId) : null;
  const needle = query.trim().toLowerCase();

  function visible(node: ArchNode): { dimmed: boolean; highlighted: boolean; selected: boolean } {
    const matches = !needle || nodeMatches(node, needle, model.lanes);
    const inFocus = !related || related.has(node.id);
    return {
      selected: node.id === selectedId,
      highlighted: Boolean((related && related.has(node.id) && node.id !== selectedId) || (needle && matches)),
      dimmed: Boolean((needle && !matches) || (related && !inFocus)),
    };
  }

  return (
    <div ref={canvasRef} className="relative min-w-[640px]">
      <ArchitectureEdges edges={model.edges} canvasRef={canvasRef} activeIds={related} />
      <div
        className="relative rounded-xl border border-hairline bg-panel px-4 py-4 sm:px-5 sm:py-5"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Application</p>
        <p className="mt-1 text-[15px] font-medium tracking-tight">{title}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {[...model.techHighlights, model.style].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-4 flex flex-col">
          {mainLanes.map((lane, index) => (
            <LaneBlock
              key={lane.id}
              lane={lane}
              nodes={lane.nodeIds.map((id) => nodesById.get(id)).filter((node): node is ArchNode => Boolean(node))}
              showConnector={index < mainLanes.length - 1}
              visible={visible}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
          {splitLanes.length ? (
            <>
              {mainLanes.length ? <LaneConnector /> : null}
              <div className="grid gap-4 md:grid-cols-2">
                {splitLanes.map((lane) => (
                  <LaneBlock
                    key={lane.id}
                    lane={lane}
                    nodes={lane.nodeIds.map((id) => nodesById.get(id)).filter((node): node is ArchNode => Boolean(node))}
                    showConnector={false}
                    visible={visible}
                    onSelect={onSelect}
                    onHover={onHover}
                  />
                ))}
              </div>
            </>
          ) : null}
          {footerLane ? (
            <>
              {mainLanes.length || splitLanes.length ? <LaneConnector /> : null}
              <LaneBlock
                lane={footerLane}
                nodes={footerLane.nodeIds.map((id) => nodesById.get(id)).filter((node): node is ArchNode => Boolean(node))}
                showConnector={false}
                visible={visible}
                onSelect={onSelect}
                onHover={onHover}
              />
            </>
          ) : null}
        </div>
      </div>

      {model.externals.length ? (
        <div className="mt-5 px-1" onClick={(event) => event.stopPropagation()}>
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">External systems</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Dependencies outside this application</p>
          <div className="mt-3 flex flex-wrap items-stretch gap-2.5">
            {model.externals.map((node) => (
              <ArchitectureNode
                key={node.id}
                node={node}
                onSelect={onSelect}
                onHover={onHover}
                {...visible(node)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LaneBlock({
  lane,
  nodes,
  showConnector,
  visible,
  onSelect,
  onHover,
}: {
  lane: ArchLane;
  nodes: ArchNode[];
  showConnector: boolean;
  visible: (node: ArchNode) => { dimmed: boolean; highlighted: boolean; selected: boolean };
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <div>
      <div className="py-1">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">{lane.label}</p>
        {lane.caption ? (
          <p className="mt-1 max-w-[68ch] text-[12px] leading-5 text-muted-foreground">{lane.caption}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-stretch gap-2.5">
          {nodes.map((node) => (
            <ArchitectureNode
              key={node.id}
              node={node}
              onSelect={onSelect}
              onHover={onHover}
              {...visible(node)}
            />
          ))}
        </div>
      </div>
      {showConnector ? <LaneConnector /> : null}
    </div>
  );
}

function LaneConnector() {
  return (
    <div className="flex justify-center py-2" aria-hidden>
      <ArrowDownIcon className="size-3.5 text-edge" />
    </div>
  );
}

function nodeMatches(node: ArchNode, needle: string, lanes: ArchLane[]): boolean {
  const lane = lanes.find((item) => item.id === node.lane);
  const haystack = [node.name, node.category, node.lane, lane?.label, ...node.interfaces]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}
