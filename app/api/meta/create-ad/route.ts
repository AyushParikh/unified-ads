import { NextResponse } from "next/server";
import { createMetaCampaign, describeMetaError } from "@/lib/meta";
import { validateMeta, type MetaAdInput } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const input = (await req.json()) as MetaAdInput;
  const problems = validateMeta(input);
  if (problems.length) {
    return NextResponse.json({ errors: problems.map((message) => ({ message })) }, { status: 400 });
  }

  try {
    console.log("[meta create-ad] request", { ...input, imageUrl: input.imageUrl.slice(0, 80) });
    const result = await createMetaCampaign(input);
    console.log("[meta create-ad] response", result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[meta create-ad] failed", err);
    return NextResponse.json({ errors: describeMetaError(err) }, { status: 500 });
  }
}
