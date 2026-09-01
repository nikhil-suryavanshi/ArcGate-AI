"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CONSTRAINT_OPTIONS, INDUSTRIES, SAMPLE_BRIEFS, SCALES, ARCHITECTURE_STYLES } from "@/lib/samples";
import type { ArchitectureBrief } from "@/lib/types";
import { ArrowRightIcon, CompassIcon, LoaderCircleIcon } from "lucide-react";

type BriefFormProps = {
  brief: ArchitectureBrief;
  openaiApiKey: string;
  onOpenAIApiKeyChange: (value: string) => void;
  serverHasKey: boolean;
  onChange: (brief: ArchitectureBrief) => void;
  onSubmit: () => void;
  loading: boolean;
};

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-left text-[11px] leading-4 transition-all ${
        selected
          ? "border-primary/20 bg-primary/10 font-medium text-primary shadow-sm"
          : "border-hairline bg-background/30 text-muted-foreground hover:border-hairline-strong hover:bg-raised hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3 border-t border-hairline pt-6">
      <h3 className="text-[12px] font-semibold tracking-tight text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] font-medium text-muted-foreground">{children}</span>;
}

export function BriefForm({
  brief,
  openaiApiKey,
  onOpenAIApiKeyChange,
  serverHasKey,
  onChange,
  onSubmit,
  loading,
}: BriefFormProps) {
  function patch(partial: Partial<ArchitectureBrief>) {
    onChange({ ...brief, ...partial });
  }

  function toggleConstraint(constraint: string) {
    const next = brief.constraints.includes(constraint)
      ? brief.constraints.filter((item) => item !== constraint)
      : [...brief.constraints, constraint];
    patch({ constraints: next });
  }

  return (
    <form
      className="flex flex-col gap-0"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <section className="grid gap-4">
        <div>
          <h3 className="text-[12px] font-semibold tracking-tight text-foreground">Business context</h3>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">Describe the outcome, audience, and first-release success criteria.</p>
        </div>
        <label className="grid gap-2">
          <FieldLabel>Working title</FieldLabel>
          <Input
            value={brief.title ?? ""}
            onChange={(event) => patch({ title: event.target.value })}
            placeholder="Digital Claims Experience"
            className="h-10 rounded-xl border-hairline bg-background/45 px-3 text-[13px] shadow-none"
          />
        </label>
        <label className="grid gap-2">
          <FieldLabel>Business intent</FieldLabel>
          <Textarea
            value={brief.businessContext}
            onChange={(event) => patch({ businessContext: event.target.value })}
            placeholder="For whom are we building this, what should change, and how will we know the first release worked?"
            className="min-h-44 resize-y rounded-2xl border-hairline-strong bg-background/55 px-4 py-3.5 text-[14px] leading-6 placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15"
          />
        </label>
        <div className="grid gap-2">
          <FieldLabel>Examples</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_BRIEFS.map((sample) => (
              <Chip
                key={sample.id}
                selected={brief.businessContext === sample.businessContext}
                onClick={() =>
                  onChange({
                    title: sample.title,
                    businessContext: sample.businessContext,
                    industry: sample.industry,
                    constraints: sample.constraints,
                    scale: sample.scale,
                    existingSystems: sample.existingSystems,
                    architectureStyle: sample.architectureStyle,
                  })
                }
              >
                {sample.label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <Section title="Industry & Scale">
        <div className="grid gap-2">
          <FieldLabel>Industry</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map((industry) => (
              <Chip
                key={industry}
                selected={brief.industry === industry}
                onClick={() => patch({ industry })}
              >
                {industry}
              </Chip>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <FieldLabel>Scale</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {SCALES.map((scale) => (
              <Chip key={scale} selected={brief.scale === scale} onClick={() => patch({ scale })}>
                {scale}
              </Chip>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Architecture Approach">
        <p className="text-[12px] leading-5 text-muted-foreground">Choose how the proposed application should be structured.</p>
        <div className="flex flex-wrap gap-1.5">
          {ARCHITECTURE_STYLES.map((style) => (
            <Chip
              key={style.id}
              selected={brief.architectureStyle === style.id}
              onClick={() => patch({ architectureStyle: style.id })}
            >
              {style.label}
            </Chip>
          ))}
        </div>
        <p className="text-[12px] leading-5 text-muted-foreground">
          {ARCHITECTURE_STYLES.find((style) => style.id === brief.architectureStyle)?.hint}
        </p>
      </Section>

      <Section title="Constraints">
        <div className="flex flex-wrap gap-1.5">
          {CONSTRAINT_OPTIONS.map((constraint) => (
            <Chip
              key={constraint}
              selected={brief.constraints.includes(constraint)}
              onClick={() => toggleConstraint(constraint)}
            >
              {constraint}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Existing Systems">
        <Input
          value={brief.existingSystems}
          onChange={(event) => patch({ existingSystems: event.target.value })}
          placeholder="SAP, Salesforce, AS/400, identity provider…"
          className="h-10 rounded-xl border-hairline bg-background/45 px-3 text-[13px] shadow-none"
        />
      </Section>

      <section className="mt-6 border-t border-hairline pt-5">
        <label className="grid gap-1.5 rounded-2xl bg-raised/70 p-3.5">
          <FieldLabel>OpenAI API key</FieldLabel>
          <Input
            type="password"
            autoComplete="off"
            value={openaiApiKey}
            onChange={(event) => onOpenAIApiKeyChange(event.target.value)}
            placeholder={serverHasKey ? "Using OPENAI_API_KEY from the server" : "Paste an OpenAI API key"}
            className="h-9 rounded-xl border-hairline bg-background/55 text-[13px]"
          />
          <span className="text-[11px] leading-4 text-muted-foreground/80">
            Needed for live generation. Stored only in this browser. Get a key from{" "}
            <a
              className="text-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
            >
              OpenAI Platform
            </a>
            .
          </span>
        </label>
      </section>

      <Button
        type="submit"
        size="lg"
        className="mt-7 h-12 w-full rounded-2xl text-[14px] font-semibold tracking-tight shadow-[0_8px_20px_oklch(0.535_0.18_250_/_0.22)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_12px_24px_oklch(0.535_0.18_250_/_0.28)] focus-visible:ring-2 focus-visible:ring-primary/30 active:translate-y-0"
        disabled={loading}
      >
        {loading ? (
          <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
        ) : (
          <CompassIcon data-icon="inline-start" />
        )}
        {loading ? "Creating proposal" : "Create proposal"}
        {!loading ? <ArrowRightIcon data-icon="inline-end" /> : null}
      </Button>
    </form>
  );
}
