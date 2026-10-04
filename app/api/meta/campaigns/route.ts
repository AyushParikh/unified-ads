import { NextResponse } from "next/server";
import { deleteMetaCampaign, describeMetaError, listMetaCampaigns } from "@/lib/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campaigns = await listMetaCampaigns();
    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("[meta campaigns] list failed", err);
    return NextResponse.json({ errors: describeMetaError(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ errors: [{ message: "Invalid campaign id." }] }, { status: 400 });
  }
  try {
    await deleteMetaCampaign(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[meta campaigns] delete failed", err);
    return NextResponse.json({ errors: describeMetaError(err) }, { status: 500 });
  }
}
