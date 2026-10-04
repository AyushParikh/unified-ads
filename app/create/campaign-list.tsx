"use client";

import { useCallback, useEffect, useState } from "react";

type Platform = "google" | "meta";
type Campaign = { id: string; name: string; status: string; url: string; platform: Platform };
type ApiErrors = { errors?: { field?: string; message: string }[] };

const badge: Record<string, string> = {
  ENABLED: "bg-green-100 text-green-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-amber-100 text-amber-800",
};

const platformDot: Record<Platform, string> = {
  google: "#4285f4",
  meta: "#0866ff",
};

const platformLabel: Record<Platform, string> = {
  google: "Google",
  meta: "Meta",
};

const endpoints: Record<Platform, string> = {
  google: "/api/campaigns",
  meta: "/api/meta/campaigns",
};

async function loadPlatform(p: Platform): Promise<{ campaigns: Campaign[]; error: string | null }> {
  try {
    const res = await fetch(endpoints[p], { cache: "no-store" });
    const body = await res.json();
    if (!res.ok) {
      const msg = body.errors?.map((e: { message: string }) => e.message).join("; ") ?? "Request failed.";
      return { campaigns: [], error: `${platformLabel[p]}: ${msg}` };
    }
    return {
      campaigns: (body.campaigns as Omit<Campaign, "platform">[]).map((c) => ({ ...c, platform: p })),
      error: null,
    };
  } catch (e) {
    return { campaigns: [], error: `${platformLabel[p]}: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export default function CampaignList({ refreshKey }: { refreshKey: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrors([]);
    const results = await Promise.all([loadPlatform("google"), loadPlatform("meta")]);
    setCampaigns(results.flatMap((r) => r.campaigns));
    setErrors(results.map((r) => r.error).filter((x): x is string => !!x));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function remove(c: Campaign) {
    if (!confirm(`Delete "${c.name}"? This can't be undone.`)) return;
    setDeleting(c.id);
    try {
      const res = await fetch(`${endpoints[c.platform]}?id=${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body: ApiErrors = await res.json();
        throw new Error(body.errors?.map((e) => e.message).join("; ") ?? "Delete failed.");
      }
      setCampaigns((prev) => prev?.filter((x) => !(x.id === c.id && x.platform === c.platform)) ?? null);
    } catch (e) {
      setErrors((prev) => [...prev, e instanceof Error ? e.message : String(e)]);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="mt-12">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your campaigns</h2>
        <button onClick={load} className="text-sm text-blue-700 underline">Refresh</button>
      </div>
      {errors.length > 0 && (
        <ul className="mb-3 list-disc rounded-md bg-red-50 p-3 pl-7 text-sm text-red-700">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
      {campaigns === null && errors.length === 0 && <p className="text-sm text-zinc-500">Loading…</p>}
      {campaigns?.length === 0 && errors.length === 0 && <p className="text-sm text-zinc-500">No campaigns yet.</p>}
      {campaigns && campaigns.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200">
          {campaigns.map((c) => (
            <li key={`${c.platform}:${c.id}`} className="flex items-center gap-3 px-3 py-2.5">
              <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: platformDot[c.platform] }} title={platformLabel[c.platform]} />
              <div className="min-w-0 flex-1">
                <a href={c.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium hover:underline">
                  {c.name}
                </a>
                <span className="text-xs text-zinc-500">{platformLabel[c.platform]} · ID {c.id}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge[c.status] ?? "bg-zinc-100 text-zinc-700"}`}>
                {c.status}
              </span>
              <button
                onClick={() => remove(c)}
                disabled={deleting === c.id}
                className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting === c.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
