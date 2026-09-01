"use client";

import { useLayoutEffect, useRef } from "react";
import type { ArchEdge } from "./map-architecture";

type ArchitectureEdgesProps = {
  edges: ArchEdge[];
  canvasRef: React.RefObject<HTMLDivElement | null>;
  activeIds: Set<string> | null;
};

export function ArchitectureEdges({ edges, canvasRef, activeIds }: ArchitectureEdgesProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const container = canvasRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    function draw() {
      if (!container || !svg) return;
      for (const edge of edges) {
        const path = svg.querySelector(`[data-edge-id="${cssEscape(edge.id)}"]`);
        const fromEl = container.querySelector(`[data-arch-node="${cssEscape(edge.from)}"]`);
        const toEl = container.querySelector(`[data-arch-node="${cssEscape(edge.to)}"]`);
        if (!(path instanceof SVGPathElement) || !(fromEl instanceof HTMLElement) || !(toEl instanceof HTMLElement)) {
          continue;
        }
        const from = relativeTo(fromEl, container);
        const to = relativeTo(toEl, container);
        path.setAttribute("d", connector(from, to));
        const active = !activeIds || activeIds.has(edge.from) || activeIds.has(edge.to);
        path.setAttribute("class", active ? "text-edge-strong" : "text-edge-muted");
        path.setAttribute("stroke-width", active ? "1.15" : "0.9");
      }
    }

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    window.addEventListener("resize", draw);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [activeIds, canvasRef, edges]);

  if (!edges.length) return null;

  return (
    <svg ref={svgRef} className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
      <defs>
        <marker
          id="arch-arrow-sync"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </marker>
      </defs>
      {edges.map((edge) => (
        <path
          key={edge.id}
          data-edge-id={edge.id}
          d=""
          fill="none"
          className="text-edge"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray={edge.kind === "async" ? "4 4" : undefined}
          markerEnd="url(#arch-arrow-sync)"
        />
      ))}
    </svg>
  );
}

function relativeTo(el: HTMLElement, ancestor: HTMLElement) {
  const box = { left: 0, top: 0, width: el.offsetWidth, height: el.offsetHeight };
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    box.left += node.offsetLeft;
    box.top += node.offsetTop;
    node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
  }
  return box;
}

function connector(
  from: { left: number; top: number; width: number; height: number },
  to: { left: number; top: number; width: number; height: number }
) {
  const goingDown = to.top >= from.top;
  const x1 = from.left + from.width / 2;
  const x2 = to.left + to.width / 2;
  const y1 = goingDown ? from.top + from.height : from.top;
  const y2 = goingDown ? to.top : to.top + to.height;
  const midY = y1 + (y2 - y1) * 0.45;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return value.replace(/"/g, '\\"');
}
