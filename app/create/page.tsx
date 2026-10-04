"use client";

import Link from "next/link";
import { useState } from "react";
import CampaignList from "./campaign-list";
import {
  LIMITS,
  parseKeywords,
  validate,
  validateMeta,
  type AdInput,
  type MetaAdInput,
} from "@/lib/validate";

type Platform = "google" | "meta";

type GoogleResult =
  | { ok: true; platform: "google"; campaignId: string; url: string }
  | { ok: false; errors: { field?: string; message: string }[] };

type MetaResult =
  | { ok: true; platform: "meta"; campaignId: string; adId: string; url: string }
  | { ok: false; errors: { field?: string; message: string }[] };

type Result = GoogleResult | MetaResult;

const input = "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";
const label = "block text-sm font-medium text-zinc-800";

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={`text-xs ${value.length > max ? "text-red-600" : "text-zinc-500"}`}>
      {value.length}/{max}
    </span>
  );
}

const platformMeta: Record<Platform, { label: string; dot: string; rejectedBy: string }> = {
  google: { label: "Google", dot: "#4285f4", rejectedBy: "Google Ads" },
  meta: { label: "Meta", dot: "#0866ff", rejectedBy: "Meta" },
};

export default function Home() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("google");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [headlines, setHeadlines] = useState(["", "", ""]);
  const [descriptions, setDescriptions] = useState(["", ""]);
  const [keywords, setKeywords] = useState("");
  const [metaPrimaryText, setMetaPrimaryText] = useState("");
  const [metaHeadline, setMetaHeadline] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaImageUrl, setMetaImageUrl] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  function reset() {
    setResult(null);
    setProblems([]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    reset();

    if (platform === "google") {
      const data: AdInput = {
        businessName: String(f.get("businessName")),
        websiteUrl: String(f.get("websiteUrl")).trim(),
        description: String(f.get("description")),
        dailyBudget: Number(f.get("dailyBudget")),
        location: String(f.get("location")),
        headlines,
        descriptions,
        keywords: parseKeywords(keywords),
      };
      const errs = validate(data);
      setProblems(errs);
      if (errs.length) return;
      await send("/api/create-ad", data, "google");
    } else {
      const data: MetaAdInput = {
        businessName: String(f.get("businessName")),
        websiteUrl: String(f.get("websiteUrl")).trim(),
        primaryText: metaPrimaryText,
        headline: metaHeadline,
        description: metaDescription || undefined,
        dailyBudget: Number(f.get("dailyBudget")),
        location: String(f.get("location")),
        imageUrl: metaImageUrl.trim(),
      };
      const errs = validateMeta(data);
      setProblems(errs);
      if (errs.length) return;
      await send("/api/meta/create-ad", data, "meta");
    }
  }

  async function send(url: string, data: unknown, p: Platform) {
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (res.ok) setRefreshKey((k) => k + 1);
      setResult(
        res.ok
          ? ({ ok: true, platform: p, ...body } as Result)
          : { ok: false, errors: body.errors ?? [{ message: "Request failed." }] },
      );
    } catch (err) {
      setResult({ ok: false, errors: [{ message: String(err) }] });
    } finally {
      setLoading(false);
    }
  }

  const kwCount = parseKeywords(keywords).length;

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Link href="/" className="mb-4 inline-block text-sm text-muted hover:text-ink">← Unified Ads</Link>
      <h1 className="mb-6 font-display text-3xl">Create an ad</h1>

      {!open && (
        <button onClick={() => setOpen(true)} className="rounded-md bg-ink px-5 py-2.5 font-medium text-paper hover:bg-accent">
          Create ad
        </button>
      )}

      {open && !(result?.ok) && (
        <form onSubmit={onSubmit} className="space-y-5">
          <fieldset>
            <legend className={label}>Platform</legend>
            <div className="mt-2 flex gap-2">
              {(Object.keys(platformMeta) as Platform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlatform(p);
                    reset();
                  }}
                  className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition ${
                    platform === p ? "border-ink bg-ink text-paper" : "border-zinc-300 text-zinc-700 hover:border-ink"
                  }`}
                >
                  <i className="h-2 w-2 rounded-full" style={{ background: platformMeta[p].dot }} />
                  {platformMeta[p].label}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label className={label}>Business name</label>
            <input name="businessName" required className={input} />
          </div>
          <div>
            <label className={label}>Website URL</label>
            <input name="websiteUrl" type="url" required placeholder="https://example.com" className={input} />
          </div>

          {platform === "google" && (
            <div>
              <label className={label}>What are you advertising?</label>
              <textarea name="description" required rows={2} className={input} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>
                Daily budget {platform === "google" ? "(CAD)" : "(account currency)"}
              </label>
              <input name="dailyBudget" type="number" min="1" step="0.01" required className={input} />
            </div>
            <div>
              <label className={label}>Target location</label>
              <input name="location" required placeholder="Canada or Toronto" className={input} />
            </div>
          </div>

          {platform === "google" && (
            <>
              <fieldset className="space-y-2">
                <legend className={label}>Headlines</legend>
                {headlines.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={h}
                      onChange={(e) => setHeadlines(headlines.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={`Headline ${i + 1}`}
                      className={input}
                    />
                    <Counter value={h} max={LIMITS.headline} />
                  </div>
                ))}
              </fieldset>

              <fieldset className="space-y-2">
                <legend className={label}>Descriptions</legend>
                {descriptions.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <textarea
                      value={d}
                      rows={2}
                      onChange={(e) => setDescriptions(descriptions.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={`Description ${i + 1}`}
                      className={input}
                    />
                    <Counter value={d} max={LIMITS.description} />
                  </div>
                ))}
              </fieldset>

              <div>
                <label className={label}>
                  Keywords <span className="font-normal text-zinc-500">(comma separated, {LIMITS.minKeywords}–{LIMITS.maxKeywords})</span>
                </label>
                <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} rows={2} className={input} />
                <span className={`text-xs ${kwCount > LIMITS.maxKeywords ? "text-red-600" : "text-zinc-500"}`}>{kwCount} keywords</span>
              </div>
            </>
          )}

          {platform === "meta" && (
            <>
              <div>
                <label className={label}>Primary text</label>
                <textarea
                  value={metaPrimaryText}
                  onChange={(e) => setMetaPrimaryText(e.target.value)}
                  rows={3}
                  className={input}
                  placeholder="The main body copy shown above the image."
                />
                <Counter value={metaPrimaryText} max={LIMITS.metaPrimaryText} />
              </div>
              <div>
                <label className={label}>Headline</label>
                <div className="flex items-center gap-2">
                  <input value={metaHeadline} onChange={(e) => setMetaHeadline(e.target.value)} className={input} />
                  <Counter value={metaHeadline} max={LIMITS.metaHeadline} />
                </div>
              </div>
              <div>
                <label className={label}>
                  Description <span className="font-normal text-zinc-500">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className={input} />
                  <Counter value={metaDescription} max={LIMITS.metaDescription} />
                </div>
              </div>
              <div>
                <label className={label}>Image URL</label>
                <input
                  value={metaImageUrl}
                  onChange={(e) => setMetaImageUrl(e.target.value)}
                  type="url"
                  placeholder="https://example.com/ad.jpg"
                  className={input}
                />
                <p className="mt-1 text-xs text-zinc-500">Meta fetches this URL and uploads it to your ad account.</p>
              </div>
            </>
          )}

          {problems.length > 0 && (
            <ul className="list-disc rounded-md bg-red-50 p-3 pl-7 text-sm text-red-700">
              {problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}
          {result && !result.ok && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">{platformMeta[platform].rejectedBy} rejected the request:</p>
              <ul className="mt-1 list-disc pl-5">
                {result.errors.map((er, i) => (
                  <li key={i}>{er.field && <code className="mr-1">{er.field}:</code>}{er.message}</li>
                ))}
              </ul>
            </div>
          )}

          <button disabled={loading} className="rounded-md bg-ink px-5 py-2.5 font-medium text-paper hover:bg-accent disabled:opacity-60">
            {loading ? "Creating campaign…" : "Create paused campaign"}
          </button>
        </form>
      )}

      {result?.ok && (
        <div className="rounded-md bg-green-50 p-4 text-green-900">
          <p className="font-medium">Campaign created (paused).</p>
          <p className="mt-1 text-sm">Campaign ID: <code>{result.campaignId}</code></p>
          <a href={result.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-blue-700 underline">
            Open in {result.platform === "google" ? "Google Ads" : "Meta Ads Manager"}
          </a>
        </div>
      )}

      <CampaignList refreshKey={refreshKey} />
    </main>
  );
}
