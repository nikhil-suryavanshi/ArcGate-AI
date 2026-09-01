"use client";

import { CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";

const STEPS = [
  "Reading business intent",
  "Deriving functional requirements",
  "Deriving non-functional requirements",
  "Drafting application architecture (app layers)",
  "Capturing assumptions",
];

export function LoadingAnalysis() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => (current < STEPS.length - 1 ? current + 1 : current));
    }, 1600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-[28rem] flex-col justify-center rounded-[1.35rem] border border-hairline bg-card/75 px-6 py-10 shadow-[0_18px_60px_oklch(0.25_0.02_258_/_0.07)] sm:px-8">
      <div className="max-w-xl">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-primary uppercase">Creating your proposal</p>
        <h2 className="font-heading mt-2 text-[1.85rem] leading-[1.15] tracking-tight">
          Turning your intent into a practical first solution
        </h2>
        <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
          OpenAI is producing functional requirements, non-functional requirements, application
          architecture, and assumptions for the solution we should propose.
        </p>
      </div>
      <ol className="mt-8 max-w-lg space-y-2">
        {STEPS.map((label, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] ${
                active
                  ? "bg-primary/8 text-foreground"
                  : done
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? "border-primary/40 bg-primary text-primary-foreground shadow-[0_4px_12px_oklch(0.535_0.18_250_/_0.2)]"
                    : active
                      ? "border-primary/35 bg-card text-primary"
                      : "border-hairline"
                }`}
              >
                {done ? <CheckIcon className="size-3.5" /> : String(index + 1).padStart(2, "0")}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
