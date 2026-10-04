import type { ErrorDetail } from "./ads";

// Meta Marketing API via Graph API (fetch — no SDK). Mirrors the Google adapter's
// surface so the UI can treat both platforms uniformly.

const API_VERSION = "v22.0";
const GRAPH = `https://graph.facebook.com/${API_VERSION}`;

type MetaInput = {
  businessName: string;
  websiteUrl: string;
  primaryText: string;
  headline: string;
  description?: string;
  dailyBudget: number;
  location: string;
  imageUrl: string;
};

type MetaError = { message?: string; error_user_msg?: string; error_user_title?: string };

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function creds() {
  return {
    token: env("META_ACCESS_TOKEN"),
    accountId: env("META_AD_ACCOUNT_ID"),
    pageId: env("META_PAGE_ID"),
  };
}

async function graph<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  token: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = new URL(`${GRAPH}${path}`);
  const body = new URLSearchParams();
  body.set("access_token", token);
  if (params) for (const [k, v] of Object.entries(params)) body.set(k, String(v));

  const init: RequestInit = { method };
  if (method === "GET" || method === "DELETE") {
    url.search = body.toString();
  } else {
    init.body = body;
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Meta API ${method} ${path}: non-JSON response (${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok) {
    const err = (json as { error?: MetaError }).error ?? {};
    const msg = err.error_user_msg ?? err.message ?? JSON.stringify(json);
    throw new MetaApiError(msg, path);
  }
  return json as T;
}

export class MetaApiError extends Error {
  constructor(message: string, public readonly path: string) {
    super(message);
    this.name = "MetaApiError";
  }
}

export function describeMetaError(err: unknown): ErrorDetail[] {
  if (err instanceof MetaApiError) return [{ field: err.path, message: err.message }];
  return [{ message: err instanceof Error ? err.message : String(err) }];
}

// Resolve a free-text location to a Meta targeting spec. Tries country first, then
// region, then city — picks the first hit. Returns an object you plug into targeting.
async function resolveGeo(token: string, query: string): Promise<Record<string, unknown>> {
  const search = async (type: "country" | "region" | "city") => {
    const url = new URL(`${GRAPH}/search`);
    url.searchParams.set("access_token", token);
    url.searchParams.set("type", "adgeolocation");
    url.searchParams.set("location_types", `["${type}"]`);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "1");
    const res = await fetch(url);
    const json = (await res.json()) as { data?: Array<{ key: string; country_code?: string }> };
    return json.data?.[0];
  };

  const country = await search("country");
  if (country?.country_code) return { countries: [country.country_code] };
  const region = await search("region");
  if (region) return { regions: [{ key: region.key }] };
  const city = await search("city");
  if (city) return { cities: [{ key: city.key, radius: 25, distance_unit: "kilometer" }] };
  throw new MetaApiError(`Couldn't find a Meta location matching "${query}".`, "location");
}

export type MetaCampaignSummary = {
  id: string;
  name: string;
  status: string;
  url: string;
};

export async function createMetaCampaign(input: MetaInput) {
  const { token, accountId, pageId } = creds();
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const name = `${input.businessName.trim()} – ${stamp}`;

  // 1. Campaign
  const campaign = await graph<{ id: string }>(
    "POST",
    `/${accountId}/campaigns`,
    token,
    {
      name,
      objective: "OUTCOME_TRAFFIC",
      status: "PAUSED",
      special_ad_categories: "[]",
      buying_type: "AUCTION",
      is_adset_budget_sharing_enabled: "false",
    },
  );

  // 2. Resolve location and create ad set
  const geo = await resolveGeo(token, input.location.trim());
  const targeting = {
    geo_locations: geo,
    publisher_platforms: ["facebook"],
    facebook_positions: ["feed"],
    device_platforms: ["mobile", "desktop"],
  };
  const dailyBudgetCents = Math.round(input.dailyBudget * 100);
  const adSet = await graph<{ id: string }>(
    "POST",
    `/${accountId}/adsets`,
    token,
    {
      name: `${input.businessName.trim()} – Ad set`,
      campaign_id: campaign.id,
      daily_budget: dailyBudgetCents,
      billing_event: "IMPRESSIONS",
      optimization_goal: "LINK_CLICKS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      targeting: JSON.stringify(targeting),
      status: "PAUSED",
      start_time: new Date(Date.now() + 60_000).toISOString(),
    },
  );

  // 3. Fetch the image server-side and upload as base64 bytes. Meta's /adimages
  // URL-based path is capability-gated; the multipart file path is finicky about
  // field names and content types. Base64 via the `bytes` parameter is what the
  // official FB Business SDK uses and is the most reliable.
  const imgRes = await fetch(input.imageUrl);
  if (!imgRes.ok) {
    throw new MetaApiError(`Couldn't fetch image URL (HTTP ${imgRes.status}).`, "imageUrl");
  }
  const contentType = (imgRes.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (contentType && !["image/jpeg", "image/jpg", "image/png"].includes(contentType)) {
    throw new MetaApiError(`Meta ad images must be JPG or PNG (got "${contentType}").`, "imageUrl");
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());
  console.log(`[meta create-ad] image fetched: ${buf.length} bytes, type=${contentType || "unknown"}`);
  const b64 = buf.toString("base64");

  const img = await graph<{ images: Record<string, { hash: string }> }>(
    "POST",
    `/${accountId}/adimages`,
    token,
    { bytes: b64 },
  );
  const imageHash = Object.values(img.images)[0]?.hash;
  if (!imageHash) throw new MetaApiError("Meta didn't return an image_hash after upload.", "imageUrl");

  // 4. Ad creative
  const objectStorySpec = {
    page_id: pageId,
    link_data: {
      link: input.websiteUrl,
      message: input.primaryText,
      name: input.headline,
      ...(input.description ? { description: input.description } : {}),
      image_hash: imageHash,
      call_to_action: { type: "LEARN_MORE", value: { link: input.websiteUrl } },
    },
  };
  const creative = await graph<{ id: string }>(
    "POST",
    `/${accountId}/adcreatives`,
    token,
    {
      name: `${input.businessName.trim()} – Creative`,
      object_story_spec: JSON.stringify(objectStorySpec),
    },
  );

  // 5. Ad
  const ad = await graph<{ id: string }>(
    "POST",
    `/${accountId}/ads`,
    token,
    {
      name: `${input.businessName.trim()} – Ad`,
      adset_id: adSet.id,
      creative: JSON.stringify({ creative_id: creative.id }),
      status: "PAUSED",
    },
  );

  return {
    campaignId: campaign.id,
    adSetId: adSet.id,
    adId: ad.id,
    url: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${accountId.replace(/^act_/, "")}&selected_campaign_ids=${campaign.id}`,
  };
}

export async function listMetaCampaigns(): Promise<MetaCampaignSummary[]> {
  const { token, accountId } = creds();
  const url = new URL(`${GRAPH}/${accountId}/campaigns`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("fields", "id,name,status");
  url.searchParams.set("limit", "100");
  const res = await fetch(url);
  const json = (await res.json()) as { data?: Array<{ id: string; name: string; status: string }>; error?: MetaError };
  if (!res.ok) {
    const msg = json.error?.error_user_msg ?? json.error?.message ?? "Meta list failed";
    throw new MetaApiError(msg, "campaigns");
  }
  const accountNum = accountId.replace(/^act_/, "");
  return (json.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    url: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${accountNum}&selected_campaign_ids=${c.id}`,
  }));
}

export async function deleteMetaCampaign(id: string) {
  const { token } = creds();
  await graph<{ success: boolean }>("DELETE", `/${id}`, token);
}
