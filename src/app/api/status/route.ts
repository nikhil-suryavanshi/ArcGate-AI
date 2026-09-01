import { NextResponse } from "next/server";
import { hasOpenAIKey, openAIModel } from "@/lib/openai";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    openai: hasOpenAIKey(),
    model: openAIModel(),
  });
}
