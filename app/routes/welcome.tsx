import { useState } from "react";
import { Form, data, useNavigation } from "react-router";
import type { Route } from "./+types/welcome";
import { profileOf, saveProfile } from "~/lib/env.server";
import { b, ems, list } from "~/lib/blanks";
import { Pixel } from "~/components/pixel";

export async function loader({ request }: Route.LoaderArgs) {
  return { saved: await profileOf(request) };
}

export async function action({ request }: Route.ActionArgs) {
  const f = await request.formData();
  const name = String(f.get("name") ?? "").trim().slice(0, 60);
  const a1 = String(f.get("a1") ?? ""), a3 = String(f.get("a3") ?? "");
  const a2 = f.getAll("a2").map(String).filter((v) => list("onboard.2.options").includes(v));
  if (!name || !list("onboard.1.options").includes(a1) || !list("onboard.3.options").includes(a3) || f.get("ok") !== "on")
    return data({ error: "Answer each step, then tick the box." }, { status: 400 });
  return saveProfile(request, { name, a1, a2, a3 });
}

const SCENES = ["dawn", "noon", "field", "dusk", "night", "meadow"];

function Two({ text }: { text: string }) {
  return <>{ems(text).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part))}</>;
}

function Choice({ name, value, multi, checked, onChange, index }: { name: string; value: string; multi?: boolean; checked: boolean; onChange: () => void; index: string }) {
  return (
    <label className={`row flex cursor-pointer items-center gap-3 px-4 py-3 transition ${checked ? "border-accent-ink/60 bg-raised shadow-[0_1px_3px_oklch(0_0_0/0.06)]" : "hover:bg-raised"}`}>
      <input type={multi ? "checkbox" : "radio"} name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className="w-7 font-mono text-[11px] text-muted">{index}</span>
      <span className="flex-1 text-row font-medium text-ink">{value}</span>
      <span className={`grid size-5 place-items-center border text-[11px] ${multi ? "rounded-[5px]" : "rounded-full"} ${checked ? "border-accent-fill bg-accent-fill text-on-accent" : "border-line text-transparent"}`} aria-hidden="true">✓</span>
    </label>
  );
}

export default function Welcome({ loaderData, actionData }: Route.ComponentProps) {
  const busy = useNavigation().state !== "idle";
  const s = loaderData.saved;
  const [step, setStep] = useState(0);
  const [name, setName] = useState(s?.name ?? "");
  const [a1, setA1] = useState(s?.a1 ?? "");
  const [a2, setA2] = useState<string[]>(s?.a2 ?? []);
  const [a3, setA3] = useState(s?.a3 ?? "");
  const [ok, setOk] = useState(false);
  const last = 5;
  const ready = [true, !!name.trim(), !!a1, true, !!a3, ok][step];
  const next = () => ready && setStep((n) => Math.min(last, n + 1));
  const toggle = (v: string) => setA2((now) => (now.includes(v) ? now.filter((x) => x !== v) : [...now, v]));
  const q = (n: 1 | 2 | 3) => list(`onboard.${n}.options`);

  return (
    <main id="page-welcome" className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,34rem)]">
      <Form method="post" className="flex flex-col px-6 py-8 md:px-12" onKeyDown={(e) => { if (e.key === "Enter" && step < last) { e.preventDefault(); next(); } }}>
        <div className="flex items-center justify-between">
          <a href={b("link.landing")} className="font-serif text-[28px] leading-none text-ink">{b("brand.name")}</a>
          <span className="font-mono text-[11px] text-muted">{String(step + 1).padStart(2, "0")} / {String(last + 1).padStart(2, "0")}</span>
        </div>
        <div id="welcome-progress" className="mt-6 flex gap-1.5" aria-hidden="true">
          {SCENES.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= step ? "bg-ink" : "bg-line"}`} />)}
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14">
          <p className="eyebrow">{b("assistant.name")}</p>
          <div key={step} className="animate-[rise_0.5s_ease-out]">
            {step === 0 && (
              <>
                <h1 className="mt-5 text-h2 text-ink"><Two text={b("onboard.title")} /></h1>
                <p className="mt-4 text-body text-body">{b("onboard.body")}</p>
              </>
            )}
            {step === 1 && (
              <>
                <h2 className="mt-5 text-h2 text-ink">{b("onboard.name")}</h2>
                <input id="welcome-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" className="row mt-8 h-12 w-full px-4 text-[17px] text-ink outline-none transition focus:border-accent-ink" />
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="mt-5 text-h2 text-ink">{b("onboard.1.question")}</h2>
                <div className="mt-8 space-y-2">{q(1).map((v, i) => <Choice key={v} name="pick1" value={v} index={`2.${i + 1}`} checked={a1 === v} onChange={() => setA1(v)} />)}</div>
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="mt-5 text-h2 text-ink">{b("onboard.2.question")}</h2>
                <div className="mt-8 space-y-2">{q(2).map((v, i) => <Choice key={v} name="pick2" value={v} multi index={`3.${i + 1}`} checked={a2.includes(v)} onChange={() => toggle(v)} />)}</div>
              </>
            )}
            {step === 4 && (
              <>
                <h2 className="mt-5 text-h2 text-ink">{b("onboard.3.question")}</h2>
                <div className="mt-8 space-y-2">{q(3).map((v, i) => <Choice key={v} name="pick3" value={v} index={`4.${i + 1}`} checked={a3 === v} onChange={() => setA3(v)} />)}</div>
              </>
            )}
            {step === 5 && (
              <>
                <h2 className="mt-5 text-h2 text-ink"><Two text={b("onboard.done")} /></h2>
                <label className="row mt-8 flex cursor-pointer items-start gap-3 p-4">
                  <input id="welcome-ok" type="checkbox" name="ok" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5 size-4 accent-[var(--hs-accent-fill)]" />
                  <span className="text-[14px] leading-[1.5] text-body">{b("assistant.disclaimer")}</span>
                </label>
                {actionData?.error && <p className="mt-3 text-[13px] text-tone-4-ink">{actionData.error}</p>}
              </>
            )}
          </div>

          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="a1" value={a1} />
          {a2.map((v) => <input key={v} type="hidden" name="a2" value={v} />)}
          <input type="hidden" name="a3" value={a3} />

          <div className="mt-10 flex items-center gap-3">
            {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="btn btn-light">Back</button>}
            {step < last ? (
              <button type="button" id="welcome-next" onClick={next} disabled={!ready} className="btn btn-dark disabled:opacity-40">
                {step === 0 ? b("onboard.start") : "Continue"}
                <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
              </button>
            ) : (
              <button id="welcome-finish" disabled={!ok || busy} className="btn btn-dark disabled:opacity-40">{b("onboard.cta")}</button>
            )}
            {step === 3 && <span className="text-[12px] text-muted">{a2.length ? `${a2.length} picked` : "Pick any, or skip"}</span>}
          </div>
        </div>

        <p className="text-[13px] text-muted">
          <a className="text-body underline-offset-4 hover:underline" href={`mailto:${b("link.email")}`}>{b("link.email")}</a>
        </p>
      </Form>
      <div className="hidden p-3 lg:block">
        <div className="frame relative h-full overflow-hidden p-2">
          {SCENES.map((scene, i) => i <= step + 1 && (
            <div key={scene} className={`absolute inset-2 transition-opacity duration-700 ${i === step ? "opacity-100" : "opacity-0"}`}>
              <Pixel scene={scene} w={480} h={690} seed={5 + i} className="size-full rounded-[10px] object-cover" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
