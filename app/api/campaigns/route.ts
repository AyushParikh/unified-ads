import { NextResponse } from "next/server";
import { enums, ResourceNames } from "google-ads-api";
import { getCustomer, describeError } from "@/lib/ads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List all non-removed campaigns with their status.
export async function GET() {
  try {
    const { customer, customerId } = getCustomer();
    const rows = await customer.query(
      `SELECT campaign.id, campaign.name, campaign.status FROM campaign
       WHERE campaign.status != 'REMOVED' ORDER BY campaign.id DESC`,
    );
    const campaigns = rows.map((r) => ({
      id: String(r.campaign?.id),
      name: r.campaign?.name ?? "",
      status: enums.CampaignStatus[r.campaign?.status as number] ?? "UNKNOWN",
      url: `https://ads.google.com/aw/adgroups?campaignId=${r.campaign?.id}&__e=${customerId}`,
    }));
    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("[campaigns] list failed", err);
    return NextResponse.json({ errors: describeError(err) }, { status: 500 });
  }
}

// Remove a campaign: DELETE /api/campaigns?id=123
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ errors: [{ message: "Invalid campaign id." }] }, { status: 400 });
  }
  try {
    const { customer, customerId } = getCustomer();
    const res = await customer.campaigns.remove([ResourceNames.campaign(customerId, id)]);
    console.log("[campaigns] removed", JSON.stringify(res));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[campaigns] delete failed", err);
    return NextResponse.json({ errors: describeError(err) }, { status: 500 });
  }
}
