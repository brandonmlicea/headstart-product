import { timingSafeEqual } from "node:crypto";
import { Form, data, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { env, missingEnv, signedIn, signIn } from "~/lib/env.server";
import { b, ems } from "~/lib/blanks";
import { Pixel } from "~/components/pixel";

export async function loader({ request }: Route.LoaderArgs) {
  const gaps = missingEnv(["APP_PASSCODE", "SESSION_SECRET"]);
  if (!gaps.length && (await signedIn(request))) throw redirect("/");
  return { gaps };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const given = Buffer.from(String(form.get("passcode") ?? ""));
  const real = Buffer.from(env("APP_PASSCODE"));
  if (!real.length || given.length !== real.length || !timingSafeEqual(given, real)) return data({ error: "That passcode does not match." }, { status: 401 });
  return signIn(request, new URL(request.url).searchParams.get("next") ?? "/");
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  const busy = useNavigation().state !== "idle";
  return (
    <main id="page-login" className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,34rem)]">
      <div className="flex flex-col justify-between px-6 py-8 md:px-12">
        <a href={b("link.landing")} className="font-serif text-[28px] leading-none text-ink">{b("brand.name")}</a>
        <div className="mx-auto w-full max-w-sm py-16">
          <p className="eyebrow">{b("assistant.name")}</p>
          <h1 className="mt-5 text-h2 text-ink">{ems(b("assistant.greeting")).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part))}</h1>
          <p className="mt-4 text-body text-body">{b("brand.tagline")}</p>
          {loaderData.gaps.length > 0 ? (
            <pre id="login-gaps" className="row mt-8 whitespace-pre-wrap p-4 font-mono text-[12px] text-body">{loaderData.gaps.join("\n")}</pre>
          ) : (
            <Form method="post" className="mt-8 space-y-3">
              <label className="eyebrow block" htmlFor="passcode">Passcode</label>
              <input id="passcode" name="passcode" type="password" autoFocus required autoComplete="current-password" className="row h-11 w-full px-3 text-body text-ink outline-none transition focus:border-accent-ink" />
              {actionData?.error && <p className="text-[13px] text-tone-4-ink">{actionData.error}</p>}
              <button disabled={busy} className="btn btn-dark w-full justify-center disabled:opacity-60">{busy ? "Opening" : "Open"}</button>
            </Form>
          )}
        </div>
        <p className="text-[13px] text-muted">
          <a className="text-body underline-offset-4 hover:underline" href={`mailto:${b("link.email")}`}>{b("link.email")}</a>
        </p>
      </div>
      <div className="hidden p-3 lg:block">
        <div className="frame h-full p-2">
          <Pixel scene="field" w={140} h={200} seed={5} className="size-full rounded-[10px] object-cover" />
        </div>
      </div>
    </main>
  );
}
