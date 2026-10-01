"use client";

import { useState } from "react";
import CampaignList from "./campaign-list";
import { LIMITS, parseKeywords, validate, type AdInput } from "@/lib/validate";

type Result =
  | { ok: true; campaignId: string; url: string }
  | { ok: false; errors: { field?: string; message: string }[] };

const input = "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";
const label = "block text-sm font-medium text-zinc-800";

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={`text-xs ${value.length > max ? "text-red-600" : "text-zinc-500"}`}>
      {value.length}/{max}
    </span>
  );
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [headlines, setHeadlines] = useState(["", "", ""]);
  const [descriptions, setDescriptions] = useState(["", ""]);
  const [keywords, setKeywords] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
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

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/create-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (res.ok) setRefreshKey((k) => k + 1);
      setResult(res.ok ? { ok: true, ...body } : { ok: false, errors: body.errors ?? [{ message: "Request failed." }] });
    } catch (err) {
      setResult({ ok: false, errors: [{ message: String(err) }] });
    } finally {
      setLoading(false);
    }
  }

  const kwCount = parseKeywords(keywords).length;

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Google Ads campaign creator</h1>

      {!open && (
        <button onClick={() => setOpen(true)} className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
          Create ad
        </button>
      )}

      {open && !(result?.ok) && (
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className={label}>Business name</label>
            <input name="businessName" required className={input} />
          </div>
          <div>
            <label className={label}>Website URL</label>
            <input name="websiteUrl" type="url" required placeholder="https://example.com" className={input} />
          </div>
          <div>
            <label className={label}>What are you advertising?</label>
            <textarea name="description" required rows={2} className={input} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Daily budget (CAD)</label>
              <input name="dailyBudget" type="number" min="1" step="0.01" required className={input} />
            </div>
            <div>
              <label className={label}>Target location</label>
              <input name="location" required placeholder="Canada or Toronto" className={input} />
            </div>
          </div>

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

          {problems.length > 0 && (
            <ul className="list-disc rounded-md bg-red-50 p-3 pl-7 text-sm text-red-700">
              {problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}
          {result && !result.ok && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">Google Ads rejected the request:</p>
              <ul className="mt-1 list-disc pl-5">
                {result.errors.map((er, i) => (
                  <li key={i}>{er.field && <code className="mr-1">{er.field}:</code>}{er.message}</li>
                ))}
              </ul>
            </div>
          )}

          <button disabled={loading} className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Creating campaign…" : "Create paused campaign"}
          </button>
        </form>
      )}

      {result?.ok && (
        <div className="rounded-md bg-green-50 p-4 text-green-900">
          <p className="font-medium">Campaign created (paused).</p>
          <p className="mt-1 text-sm">Campaign ID: <code>{result.campaignId}</code></p>
          <a href={result.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-blue-700 underline">
            Open in Google Ads
          </a>
        </div>
      )}

      <CampaignList refreshKey={refreshKey} />
    </main>
  );
}
