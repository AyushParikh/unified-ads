import Link from "next/link";

type Css = React.CSSProperties;
const d = (s: number) => ({ "--d": `${s}s` }) as Css;

const platforms = [
  { name: "Google Ads", dot: "#4285f4", live: true },
  { name: "Meta Ads", dot: "#0866ff", live: true },
  { name: "TikTok Ads", dot: "#25f4ee", live: false },
  { name: "And more", dot: "#e8421c", live: false },
];

const campaigns = [
  { p: "Google", dot: "#4285f4", name: "Spring Sale — Search", status: "Live", budget: "CA$40/d" },
  { p: "Meta", dot: "#0866ff", name: "Retargeting — Carousel", status: "Live", budget: "CA$25/d" },
  { p: "TikTok", dot: "#25f4ee", name: "UGC Hook Test #3", status: "Paused", budget: "CA$15/d" },
  { p: "Google", dot: "#4285f4", name: "Brand Terms", status: "Paused", budget: "CA$10/d" },
];

const pillars = [
  ["01", "Create once", "Write your headlines, copy and budget one time. Unified Ads builds the campaign for each platform, in that platform's own format.", "Google and Meta live · TikTok soon"],
  ["02", "Manage in one place", "Every campaign and its status in a single list. Pause, review or delete without opening several different dashboards.", "Google and Meta live · TikTok soon"],
  ["03", "Optimize for conversions", "See what actually converts across platforms, side by side, and move budget to the ads that earn it.", "On the roadmap"],
];

const notes = [
  ["Paused by default", "Every new campaign is built paused. Nothing spends until you switch it on."],
  ["Your accounts, connected directly", "Campaigns are created inside your own ad accounts. No middleman owns your data."],
  ["All or nothing", "A campaign is created as one request. If any piece is rejected, nothing half-built is left behind."],
  ["Plain language", "No jargon, no hunting through nested menus. Just the few fields that matter."],
];

const tabs = ["Google Ads Manager", "Meta Ads Manager", "TikTok Ads Manager", "That one spreadsheet"];

function Mark() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink">
      <span className="h-2.5 w-2.5 rounded-full bg-accent" />
    </span>
  );
}

function Tag({ live }: { live: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        live ? "bg-accent text-paper" : "border border-line text-muted"
      }`}
    >
      {live ? "Live" : "Soon"}
    </span>
  );
}

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[640px] w-[640px] rounded-full bg-accent/20 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl tracking-tight">
          <Mark /> Unified Ads
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#how" className="hidden text-muted transition hover:text-ink sm:block">How it works</a>
          <Link href="/create" className="rounded-full border border-ink px-4 py-1.5 transition hover:bg-ink hover:text-paper">
            Open the app
          </Link>
        </nav>
      </header>

      {/* hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div>
          <p className="rise font-mono text-xs uppercase tracking-[0.2em] text-accent" style={d(0.05)}>
            The unified ads manager
          </p>
          <h1 className="rise mt-5 font-display text-[clamp(2.9rem,7vw,5.6rem)] font-light leading-[0.95] tracking-tight" style={d(0.15)}>
            One place to run every ad. <em className="font-normal text-accent">Built to convert.</em>
          </h1>
          <p className="rise mt-7 max-w-xl text-lg leading-relaxed text-muted" style={d(0.3)}>
            Create, launch and manage your Google, Meta and TikTok campaigns from a single workspace — and spend your budget on the
            ads that actually work.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-5" style={d(0.45)}>
            <Link href="/create" className="group inline-flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 text-paper transition hover:bg-accent">
              Create an ad
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
            <a href="#how" className="text-sm underline decoration-line underline-offset-4 transition hover:decoration-ink">
              See how it works
            </a>
          </div>
          <div className="rise mt-10 flex flex-wrap items-center gap-x-5 gap-y-2" style={d(0.6)}>
            {platforms.slice(0, 3).map((p) => (
              <span key={p.name} className="flex items-center gap-2 text-sm text-muted">
                <i className="h-2 w-2 rounded-full" style={{ background: p.dot }} /> {p.name.replace(" Ads", "")}
                <Tag live={p.live} />
              </span>
            ))}
          </div>
        </div>

        {/* unified console */}
        <div className="rise relative mx-auto w-full max-w-md" style={d(0.5)}>
          <div className="drift rounded-2xl border border-line bg-[#fbf8f2] p-5 shadow-[0_30px_60px_-25px_rgba(21,17,14,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg">All campaigns</p>
              <div className="flex gap-1.5 font-mono text-[10px] uppercase tracking-wider">
                {["All", "Google", "Meta", "TikTok"].map((t, i) => (
                  <span key={t} className={`rounded-full px-2.5 py-1 ${i === 0 ? "bg-ink text-paper" : "border border-line text-muted"}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ul className="divide-y divide-line">
              {campaigns.map((c, i) => (
                <li key={c.name} className="rise flex items-center gap-3 py-3" style={d(0.9 + i * 0.15)}>
                  <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.dot }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{c.p} · {c.budget}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.status === "Live" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted/70">Illustrative example</p>
          </div>
          <div className="stamp absolute -right-3 -top-5 rounded-md border-2 border-accent bg-paper/80 px-4 py-1.5 font-mono text-sm font-bold uppercase tracking-[0.25em] text-accent">
            1 place
          </div>
          <div className="drift absolute -bottom-6 -left-6 hidden rounded-xl bg-ink px-4 py-3 font-mono text-xs text-paper shadow-xl sm:block" style={{ "--r": "-4deg", "--d": "1.2s" } as Css}>
            <span className="text-accent">✓</span> create once · launch everywhere
          </div>
        </div>
      </section>

      {/* platform marquee */}
      <div className="relative border-y border-line bg-paper-2/60 py-4">
        <div className="marquee flex w-max gap-12 whitespace-nowrap font-display text-2xl italic text-ink/70">
          {[...platforms, ...platforms, ...platforms, ...platforms].map((p, i) => (
            <span key={i} className="flex items-center gap-12">
              <span className="flex items-center gap-3">
                <i className="h-2.5 w-2.5 rounded-full" style={{ background: p.dot }} /> {p.name}
              </span>
              <span className="text-accent">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* problem */}
      <section className="relative mx-auto grid max-w-6xl gap-12 px-6 py-28 md:grid-cols-2 md:items-center">
        <h2 className="font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
          Stop living in <em className="text-accent">a dozen tabs.</em>
        </h2>
        <div>
          <ul className="space-y-1 font-display text-3xl text-muted/70 md:text-4xl">
            {tabs.map((t) => (
              <li key={t} className="line-through decoration-accent decoration-2">{t}</li>
            ))}
          </ul>
          <p className="mt-6 flex items-center gap-3 font-display text-3xl md:text-4xl">
            <Mark /> Unified Ads
          </p>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Running ads across platforms shouldn&apos;t mean learning each platform&apos;s dashboard. Bring them together and spend your
            time on what converts.
          </p>
        </div>
      </section>

      {/* pillars */}
      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-28">
        <h2 className="max-w-2xl font-display text-4xl font-light leading-tight tracking-tight md:text-5xl">
          Launch faster. <em className="text-accent">Waste less.</em>
        </h2>
        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {pillars.map(([n, title, body, status]) => (
            <div key={n} className="bg-paper p-8 transition hover:bg-[#fbf8f2]">
              <span className="font-display text-6xl font-light italic text-accent">{n}</span>
              <h3 className="mt-6 font-display text-2xl">{title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{body}</p>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-muted/80">{status}</p>
            </div>
          ))}
        </div>
      </section>

      {/* notes */}
      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-line bg-paper-2/50 p-7">
              <h3 className="font-display text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* closing */}
      <section className="relative bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-28 text-center">
          <h2 className="mx-auto max-w-3xl font-display text-5xl font-light leading-[1.02] tracking-tight md:text-7xl">
            Every ad. <em className="text-accent">One place.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-paper/60">Google and Meta live today. TikTok is on the way.</p>
          <Link href="/create" className="mt-10 inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 text-paper transition hover:bg-paper hover:text-ink">
            Create an ad <span>→</span>
          </Link>
        </div>
        <footer className="mx-auto flex max-w-6xl items-center justify-between border-t border-paper/10 px-6 py-6 text-xs text-paper/40">
          <span className="font-display text-sm text-paper/60">Unified Ads</span>
          <span className="font-mono">One workspace for every ad platform</span>
        </footer>
      </section>
    </div>
  );
}
