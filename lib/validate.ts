// Shared by the form (client) and the route handler (server).
export type AdInput = {
  businessName: string;
  websiteUrl: string;
  description: string;
  dailyBudget: number;
  location: string;
  headlines: string[];
  descriptions: string[];
  keywords: string[];
};

export const LIMITS = { headline: 30, description: 90, minKeywords: 5, maxKeywords: 10 };

export function parseKeywords(raw: string): string[] {
  const seen = new Set<string>();
  for (const k of raw.split(",")) {
    const t = k.trim().replace(/\s+/g, " ");
    if (t) seen.add(t.toLowerCase());
  }
  return [...seen];
}

export function validate(i: AdInput): string[] {
  const e: string[] = [];
  if (!i.businessName?.trim()) e.push("Business name is required.");
  try {
    const u = new URL(i.websiteUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
  } catch {
    e.push("Website URL must start with http:// or https://.");
  }
  if (!i.description?.trim()) e.push("Describe what you're advertising.");
  if (!(i.dailyBudget >= 1)) e.push("Daily budget must be at least 1 CAD.");
  if (!i.location?.trim()) e.push("Target location is required.");
  if (i.headlines?.length !== 3) e.push("Exactly 3 headlines are required.");
  i.headlines?.forEach((h, n) => {
    if (!h.trim()) e.push(`Headline ${n + 1} is required.`);
    else if (h.length > LIMITS.headline) e.push(`Headline ${n + 1} is over ${LIMITS.headline} characters.`);
  });
  if (i.descriptions?.length !== 2) e.push("Exactly 2 descriptions are required.");
  i.descriptions?.forEach((d, n) => {
    if (!d.trim()) e.push(`Description ${n + 1} is required.`);
    else if (d.length > LIMITS.description) e.push(`Description ${n + 1} is over ${LIMITS.description} characters.`);
  });
  const k = i.keywords?.length ?? 0;
  if (k < LIMITS.minKeywords || k > LIMITS.maxKeywords)
    e.push(`Enter ${LIMITS.minKeywords}–${LIMITS.maxKeywords} keywords (you have ${k}).`);
  return e;
}
