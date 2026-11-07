import { Link } from "react-router";
import type { Route } from "./+types/brand";
import { palette } from "../../kit/palette.mjs";
import { FORMATS } from "../../kit/color.mjs";
import { b } from "~/lib/blanks";

type Row = { scheme: string; text: string; background: string; wcag: number; apca: number; pass: boolean };

export function loader({ request }: Route.LoaderArgs) {
  const saved = b("brand.format");
  const asked = new URL(request.url).searchParams.get("format");
  const format = FORMATS.includes(asked ?? "") ? asked! : FORMATS.includes(saved) ? saved : "oklch";
  const color = b("brand.color");
  const p = palette(color.startsWith("REQUIRED") ? "#6b7280" : color, format);
  return { format, saved, color, light: p.light as Record<string, string>, dark: p.dark as Record<string, string>, report: p.report as Row[], pass: p.pass };
}

export default function Brand({ loaderData: d }: Route.ComponentProps) {
  return (
    <main id="page-brand" className="flex-1 overflow-y-auto px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-h2">Brand and <em>contrast</em></h1>
        <p className="mt-3 max-w-xl text-muted">
          Every color comes from one brand color, <code className="rounded bg-surface px-1.5 py-0.5 text-sm">{d.color}</code>, and is shared with the landing page.
          Change it with <code className="rounded bg-surface px-1.5 py-0.5 text-sm">./fill brand.color="..."</code>.
        </p>
        <nav id="brand-formats" className="mt-8 flex flex-wrap gap-1.5" aria-label="Color format">
          {FORMATS.map((f) => (
            <Link key={f} to={`?format=${f}`} className={`rounded-full border px-3 py-1 text-sm transition ${f === d.format ? "border-accent-fill bg-accent-fill text-on-accent" : "border-line hover:bg-surface"}`}>
              {f}{f === d.saved && " (saved)"}
            </Link>
          ))}
        </nav>
        {(["light", "dark"] as const).map((scheme) => (
          <section key={scheme} id={`brand-${scheme}`} className="mt-10">
            <h2 className="text-h3">{scheme === "light" ? "Day" : "Night"}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Object.entries(d[scheme]).map(([name, value]) => (
                <div key={name} className="overflow-hidden rounded-xl border border-line">
                  <div className="h-16" style={{ background: value }} />
                  <div className="p-3">
                    <p className="text-sm font-medium">--hs-{name}</p>
                    <p className="mt-1 break-all font-mono text-xs text-muted">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        <section id="brand-contrast" className="mt-12">
          <h2 className="text-h3">Contrast {d.pass ? "passes" : "fails"} AA</h2>
          <p className="mt-2 text-sm text-muted">Every text pair, measured in WCAG 2 (goal 4.5:1) and APCA (goal Lc 60).</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr><th className="p-3 font-normal">Scheme</th><th className="p-3 font-normal">Text on background</th><th className="p-3 font-normal">WCAG</th><th className="p-3 font-normal">APCA</th><th className="p-3 font-normal">AA</th></tr>
              </thead>
              <tbody>
                {d.report.map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="p-3">{r.scheme}</td>
                    <td className="p-3">{r.text} on {r.background}</td>
                    <td className="p-3 tabular-nums">{r.wcag}:1</td>
                    <td className="p-3 tabular-nums">Lc {r.apca}</td>
                    <td className="p-3">{r.pass ? "Pass" : "Fail"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
