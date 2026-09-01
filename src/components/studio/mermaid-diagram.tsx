"use client";

import { useTheme } from "@/components/theme-toggle";
import { useEffect, useId, useRef, useState } from "react";

type MermaidDiagramProps = {
  chart: string;
  onError?: () => void;
};

const THEME_VARIABLES = {
  dark: {
    primaryColor: "#243044",
    primaryTextColor: "#e8eaee",
    primaryBorderColor: "#4a5568",
    lineColor: "#8a919c",
    secondaryColor: "#2a241c",
    tertiaryColor: "#1c2430",
  },
  light: {
    primaryColor: "#eef1f6",
    primaryTextColor: "#22293a",
    primaryBorderColor: "#b8c0cf",
    lineColor: "#7a8394",
    secondaryColor: "#f4efe4",
    tertiaryColor: "#f7f8fa",
  },
} as const;

export function MermaidDiagram({ chart, onError }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const onErrorRef = useRef(onError);
  const theme = useTheme();

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      setError(null);
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: theme === "dark" ? "dark" : "neutral",
          themeVariables: {
            background: "transparent",
            ...THEME_VARIABLES[theme],
            fontFamily: "var(--font-sans), ui-sans-serif, system-ui",
          },
        });
        const id = `arcgate-ai-${reactId}-${Math.random().toString(36).slice(2, 8)}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          const svgEl = ref.current.querySelector("svg");
          svgEl?.setAttribute("class", "mx-auto h-auto max-w-full");
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not render diagram");
          onErrorRef.current?.();
        }
      }
    }

    void renderChart();
    return () => {
      cancelled = true;
    };
  }, [chart, reactId, theme]);

  if (error) {
    if (onError) return null;
    return (
      <p className="text-[13px] text-muted-foreground">Could not render the source diagram.</p>
    );
  }

  return <div ref={ref} className="min-h-40 overflow-x-auto [&_svg]:max-w-full" />;
}
