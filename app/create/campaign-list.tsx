"use client";

import { useCallback, useEffect, useState } from "react";

type Campaign = { id: string; name: string; status: string; url: string };
type ApiErrors = { errors?: { field?: string; message: string }[] };

const badge: Record<string, string> = {
  ENABLED: "bg-green-100 text-green-800",
  PAUSED: "bg-amber-100 text-amber-800",
};

export default function CampaignList({ refreshKey }: { refreshKey: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/campaigns", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.errors?.map((e: { message: string }) => e.message).join("; ") ?? "Request failed.");
      setCampaigns(body.campaigns);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function remove(c: Campaign) {
    if (!confirm(`Delete "${c.name}"? This can't be undone.`)) return;
    setDeleting(c.id);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns?id=${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body: ApiErrors = await res.json();
        throw new Error(body.errors?.map((e) => e.message).join("; ") ?? "Delete failed.");
      }
      setCampaigns((prev) => prev?.filter((x) => x.id !== c.id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
      {error && <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {campaigns === null && !error && <p className="text-sm text-zinc-500">Loading…</p>}
      {campaigns?.length === 0 && <p className="text-sm text-zinc-500">No campaigns yet.</p>}
      <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200">
        {campaigns?.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <a href={c.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium hover:underline">
                {c.name}
              </a>
              <span className="text-xs text-zinc-500">ID {c.id}</span>
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
    </section>
  );
}
