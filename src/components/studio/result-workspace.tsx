"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ArchitectureResult, Priority } from "@/lib/types";
import { ArchitectureDiagram } from "./architecture-diagram/architecture-diagram";

const PRIORITY_LABEL: Record<Priority, string> = {
  must: "Must",
  should: "Should",
  could: "Could",
};

export function ResultWorkspace({ result }: { result: ArchitectureResult }) {
  const architecture = result.applicationArchitecture;

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.35rem] border-hairline bg-card/85 py-6 shadow-[0_14px_45px_oklch(0.25_0.02_258_/_0.06)] ring-0">
        <CardHeader className="gap-2">
          <CardDescription>Proposed application</CardDescription>
          <CardTitle className="font-heading text-[1.7rem] leading-[1.15]">{result.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-[15px] leading-7 text-muted-foreground">
          {result.proposedSolution}
        </CardContent>
      </Card>

      <Tabs defaultValue="architecture" className="gap-5">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border border-hairline bg-card/70 p-1.5 shadow-[0_6px_20px_oklch(0.25_0.02_258_/_0.035)]">
          <TabsTrigger value="architecture" className="min-h-9 rounded-xl px-3 py-2 text-[13px]">
            App architecture
          </TabsTrigger>
          <TabsTrigger value="functional" className="min-h-9 rounded-xl px-3 py-2 text-[13px]">
            Functional requirements
          </TabsTrigger>
          <TabsTrigger value="nonfunctional" className="min-h-9 rounded-xl px-3 py-2 text-[13px]">
            Non-functional requirements
          </TabsTrigger>
          <TabsTrigger value="assumptions" className="min-h-9 rounded-xl px-3 py-2 text-[13px]">
            Assumptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="space-y-5">
          <Card className="rounded-[1.35rem] border-hairline bg-card/75 py-6 ring-0">
            <CardHeader>
              <CardDescription>Application architecture style</CardDescription>
              <CardTitle className="font-sans text-lg font-medium tracking-tight">{architecture.style}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[14px] leading-7 text-muted-foreground">
              {architecture.styleRationale ? <p>{architecture.styleRationale}</p> : null}
              <p>{architecture.overview}</p>
              <p>{architecture.dataFlow}</p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.35rem] border-hairline bg-card/75 py-6 ring-0">
            <CardContent className="px-5 sm:px-6">
              <ArchitectureDiagram title={result.title} architecture={architecture} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-[1.35rem] border-hairline bg-card/75 py-6 ring-0">
              <CardHeader>
                <CardTitle className="font-sans text-base font-medium tracking-tight">Technology in this application</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {architecture.techStack.map((stack) => (
                  <div key={stack.layer}>
                    <p className="text-[14px] font-medium">{stack.layer}</p>
                    <p className="mt-0.5 text-[13px] text-foreground/80">{stack.choices.join(" · ")}</p>
                    <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{stack.why}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <ListCard title="Application integration adapters" items={architecture.integrationPoints} />
          </div>
        </TabsContent>

        <TabsContent value="functional" className="space-y-3">
          {result.functionalRequirements.map((item) => (
            <Card key={item.id} className="rounded-2xl border-hairline bg-card/75 py-5 ring-0">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground">{item.id}</p>
                    <CardTitle className="mt-1 font-sans text-base font-medium tracking-tight">{item.title}</CardTitle>
                  </div>
                  <Badge variant={item.priority === "must" ? "default" : "outline"}>
                    {PRIORITY_LABEL[item.priority]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-[14px] leading-6 text-muted-foreground">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="nonfunctional" className="grid gap-4 md:grid-cols-2">
          {result.nonFunctionalRequirements.map((item) => (
            <Card key={item.id} className="rounded-2xl border-hairline bg-card/75 py-5 ring-0">
              <CardHeader>
                <p className="text-[11px] text-muted-foreground">{item.id}</p>
                <CardTitle className="mt-1 font-sans text-base font-medium tracking-tight capitalize">{item.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[14px] leading-6 text-muted-foreground">{item.requirement}</p>
                <p className="rounded-xl border border-hairline bg-raised px-3 py-2 text-[12px] text-muted-foreground">
                  Target: {item.target}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="assumptions">
          <ListCard title="Assumptions for this application" items={result.assumptions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="rounded-[1.35rem] border-hairline bg-card/75 py-6 ring-0">
      <CardHeader>
        <CardTitle className="font-sans text-base font-medium tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="space-y-3 text-[14px] leading-6 text-muted-foreground">
            {items.map((item) => (
              <li key={item} className="border-l border-hairline-strong pl-3">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">None captured.</p>
        )}
      </CardContent>
    </Card>
  );
}
