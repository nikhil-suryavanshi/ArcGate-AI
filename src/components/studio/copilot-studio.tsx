"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toMarkdown } from "@/lib/export-markdown";
import { SAMPLE_BRIEFS } from "@/lib/samples";
import type { AnalyzeResponse, ArchitectureBrief, ArchitectureRun } from "@/lib/types";
import {
  ArrowUpRightIcon,
  CheckIcon,
  CompassIcon,
  CopyIcon,
  DownloadIcon,
  SparklesIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BriefForm } from "./brief-form";
import { LoadingAnalysis } from "./loading-analysis";
import { ResultWorkspace } from "./result-workspace";

const KEY_STORAGE = "arcgate-ai.openaiApiKey";

function subscribeOpenAIKey(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function readOpenAIKey() {
  try {
    return window.localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

const emptyBrief: ArchitectureBrief = {
  title: "",
  businessContext: "",
  industry: "Enterprise technology",
  constraints: ["Low-code / no-code", "Generative AI"],
  scale: "Enterprise",
  existingSystems: "",
  architectureStyle: "recommend",
};

export function CopilotStudio() {
  const [brief, setBrief] = useState<ArchitectureBrief>(emptyBrief);
  const storedKey = useSyncExternalStore(subscribeOpenAIKey, readOpenAIKey, () => "");
  const [keyOverride, setKeyOverride] = useState<string | null>(null);
  const keyValue = keyOverride ?? storedKey;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const [run, setRun] = useState<ArchitectureRun | null>(null);
  const [serverHasKey, setServerHasKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void fetch("/api/status")
      .then((res) => res.json())
      .then((data: { openai?: boolean }) => setServerHasKey(Boolean(data.openai)))
      .catch(() => setServerHasKey(false));
  }, []);

  function updateOpenAIApiKey(value: string) {
    setKeyOverride(value);
    try {
      if (value.trim()) window.localStorage.setItem(KEY_STORAGE, value.trim());
      else window.localStorage.removeItem(KEY_STORAGE);
    } catch {
      // ignore storage errors
    }
  }

  const openAIReady = Boolean(keyValue.trim() || serverHasKey);

  async function compose() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/architecture/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brief, openaiApiKey: keyValue.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Architecture composition failed");
      const workflow = data as ArchitectureRun;
      setRun(workflow);
      setResponse({ source: workflow.source, model: workflow.model, result: workflow.result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Architecture composition failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadMarkdown() {
    if (!response) return;
    const blob = new Blob([toMarkdown(response.result, response.model)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug(response.result.title)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyMarkdown() {
    if (!response) return;
    await navigator.clipboard.writeText(toMarkdown(response.result, response.model));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-hairline bg-header/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 sm:px-7 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_6px_18px_oklch(0.535_0.18_250_/_0.25)]">
              <CompassIcon className="size-4" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-[16px] font-semibold tracking-tight">ArcGate AI</p>
              <p className="text-[11px] font-medium text-muted-foreground">Governed architecture studio</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                openAIReady
                  ? "border-primary/15 bg-primary/8 text-foreground/85"
                  : "border-hairline-strong bg-card/60 text-muted-foreground"
              }`}
            >
              <span className={`size-1.5 rounded-full ${openAIReady ? "bg-primary" : "bg-muted-foreground/50"}`} />
              {openAIReady ? "OpenAI ready" : "OpenAI key needed"}
            </span>
            <ThemeToggle />
            {response ? (
              <>
                <Button variant="outline" size="sm" onClick={() => void copyMarkdown()}>
                  {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
                  {copied ? "Copied" : "Copy package"}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadMarkdown}>
                  <DownloadIcon data-icon="inline-start" />
                  Export
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-5 py-8 sm:px-7 lg:px-8 lg:py-12">
        <div className="mb-9 flex flex-col justify-between gap-6 lg:mb-11 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-[12px] font-semibold tracking-[0.08em] text-primary uppercase">
              <SparklesIcon className="size-3.5" />
              AI solution studio
            </p>
            <h1 className="font-heading text-4xl leading-[1.08] text-pretty sm:text-5xl">
              Shape a solution before you build it.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground sm:text-[16px]">
              Start with the outcome you need. ArcGate AI turns your brief into a governed, review-ready application proposal.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-hairline bg-card/70 p-1.5 text-[12px] shadow-[0_8px_30px_oklch(0.25_0.02_258_/_0.05)]">
            <div className="rounded-xl bg-raised px-4 py-3">
              <p className="font-semibold text-foreground">01 · Define</p>
              <p className="mt-1 text-muted-foreground">Intent & context</p>
            </div>
            <div className="rounded-xl px-4 py-3">
              <p className="font-semibold text-foreground">02 · Review</p>
              <p className="mt-1 text-muted-foreground">Your proposal</p>
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-7 lg:grid-cols-[minmax(320px,390px)_minmax(0,1fr)] lg:gap-9">
          <aside className="min-w-0 lg:sticky lg:top-[76px] lg:self-start">
            <div className="overflow-hidden rounded-[1.35rem] border border-hairline bg-card/85 shadow-[0_18px_60px_oklch(0.25_0.02_258_/_0.08)] backdrop-blur-sm">
              <div className="border-b border-hairline bg-raised/65 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
                  <div>
                    <p className="text-[14px] font-semibold tracking-tight text-foreground">Your solution brief</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">Give the model the right context.</p>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <BriefForm
                  brief={brief}
                  openaiApiKey={keyValue}
                  onOpenAIApiKeyChange={updateOpenAIApiKey}
                  serverHasKey={serverHasKey}
                  onChange={setBrief}
                  onSubmit={() => void compose()}
                  loading={loading}
                />
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            {error ? (
              <Alert variant="destructive" className="mb-5 rounded-2xl">
                <AlertTitle>Could not compose</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {loading ? (
              <LoadingAnalysis />
            ) : response ? (
              <div className="space-y-5">
                {run ? <AgentReview run={run} onApprove={() => setRun({ ...run, governance: { ...run.governance, status: "approved" }, handoffs: run.handoffs.map((handoff) => handoff.agent === "governance" ? { ...handoff, status: "complete", passedTo: "Package Writer" } : handoff.agent === "package" ? { ...handoff, status: "complete", created: "Architecture Package v1.0 is ready" } : handoff) })} /> : null}
                <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                  <div>
                    <p className="text-[14px] font-semibold tracking-tight">Your architecture proposal</p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">A focused starting point for your team to review.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
                    <Badge variant="secondary" className="rounded-full px-2.5">OpenAI · {response.model}</Badge>
                    <span>{response.result.functionalRequirements.length} FRs</span>
                    <span>{response.result.nonFunctionalRequirements.length} NFRs</span>
                    <span>{response.result.assumptions.length} assumptions</span>
                  </div>
                </div>
                <ResultWorkspace result={response.result} />
              </div>
            ) : (
              <EmptyState onPickSample={(sample) => setBrief(sample)} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function AgentReview({ run, onApprove }: { run: ArchitectureRun; onApprove: () => void }) {
  return <div className="rounded-[1.35rem] border border-hairline bg-card/80 p-5 shadow-[0_14px_45px_oklch(0.25_0.02_258_/_0.06)]">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[12px] font-semibold tracking-[0.08em] text-primary uppercase">Agent handoffs</p><p className="mt-1 text-[15px] font-semibold">Architecture Review Gate</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">{run.governance.score}/100</span></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">{run.handoffs.map((handoff) => <div key={handoff.agent} className="rounded-xl border border-hairline bg-raised/60 p-3"><p className="text-[13px] font-semibold">{handoff.label}</p><p className="mt-1 text-[11px] font-medium text-primary uppercase">{handoff.status === "review" ? "Human review needed" : handoff.status}</p><p className="mt-2 text-[12px] leading-5 text-muted-foreground">{handoff.created}</p></div>)}</div>
    <div className="mt-4 rounded-xl border border-hairline bg-background/50 p-3"><p className="text-[13px] font-semibold">Governance summary</p><p className="mt-1 text-[12px] leading-5 text-muted-foreground">{run.governance.summary}</p>{run.governance.findings.map((finding) => <p key={finding.title} className="mt-2 text-[12px] text-muted-foreground"><span className="font-semibold text-foreground">{finding.title}:</span> {finding.recommendation}</p>)}</div>
    {run.governance.status === "awaiting_review" ? <Button className="mt-4 w-full rounded-xl" onClick={onApprove}>Approve & create artefacts</Button> : <p className="mt-4 rounded-xl bg-primary/10 px-3 py-2 text-[12px] font-semibold text-primary">Architecture Package v1.0 approved and ready to export.</p>}
  </div>;
}

function EmptyState({ onPickSample }: { onPickSample: (brief: ArchitectureBrief) => void }) {
  return (
    <div className="relative isolate overflow-hidden rounded-[1.35rem] border border-hairline bg-card/75 p-6 shadow-[0_18px_60px_oklch(0.25_0.02_258_/_0.07)] sm:p-9">
      <div className="pointer-events-none absolute -top-24 -right-12 -z-10 size-64 rounded-full bg-primary/9 blur-3xl" />
      <div className="flex max-w-2xl items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SparklesIcon className="size-5" />
        </span>
        <div>
          <p className="text-[12px] font-semibold tracking-[0.08em] text-primary uppercase">Ready when you are</p>
          <h2 className="font-heading mt-2 text-[1.9rem] leading-[1.15] text-pretty sm:text-[2.1rem]">
            Turn a good brief into a confident first proposal.
          </h2>
          <p className="mt-3 text-[14px] leading-6 text-muted-foreground">Add your business intent on the left, or begin with a starter brief below.</p>
        </div>
      </div>
      <ol className="mt-9 grid gap-3 sm:grid-cols-2">
        {[
          ["01", "Functional requirements", "What the solution needs to do."],
          ["02", "Quality attributes", "The standards it must meet."],
          ["03", "Application architecture", "A practical design and technology view."],
          ["04", "Assumptions", "What needs validation before delivery."],
        ].map(([num, title, copy]) => (
          <li key={num} className="rounded-2xl border border-hairline bg-background/55 px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5">
            <p className="text-[11px] font-bold tracking-[0.08em] text-primary">{num}</p>
            <p className="mt-2 text-[14px] font-semibold tracking-tight">{title}</p>
            <p className="mt-1.5 text-[12px] leading-5 text-muted-foreground">{copy}</p>
          </li>
        ))}
      </ol>
      <div className="mt-9 border-t border-hairline pt-6">
        <p className="text-[13px] font-semibold text-foreground">Try a starter brief</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SAMPLE_BRIEFS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onPickSample(sample)}
              className="group rounded-xl border border-transparent px-3 py-3 text-left transition-colors hover:border-hairline hover:bg-raised"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold">{sample.label}</p>
                <ArrowUpRightIcon className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{sample.summary}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "architecture-package";
}
