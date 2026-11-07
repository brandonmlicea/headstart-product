import { timingSafeEqual } from "node:crypto";
import { Form, data, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { env, missingEnv, signedIn, signIn } from "~/lib/env.server";
import { b } from "~/lib/blanks";
import { Icon } from "~/components/icon";

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
    <main id="page-login" className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <a href={b("link.landing")} className="flex items-center gap-2 text-accent-ink">
          <Icon name="heart" />
          <span className="font-medium">{b("brand.name")}</span>
        </a>
        <h1 className="mt-8 text-h2">Welcome <em>back</em></h1>
        <p className="mt-3 text-muted">{b("brand.tagline")}</p>
        {loaderData.gaps.length > 0 ? (
          <pre id="login-gaps" className="mt-8 whitespace-pre-wrap rounded-xl border border-line bg-surface p-4 text-sm">{loaderData.gaps.join("\n")}</pre>
        ) : (
          <Form method="post" className="mt-8 space-y-3">
            <label className="block text-sm text-muted" htmlFor="passcode">Passcode</label>
            <input id="passcode" name="passcode" type="password" autoFocus required autoComplete="current-password" className="w-full rounded-xl border border-line bg-raised px-4 py-3 outline-none transition focus:border-accent-ink" />
            {actionData?.error && <p className="text-sm text-accent-ink">{actionData.error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-accent-fill px-4 py-3 font-medium text-on-accent transition hover:brightness-110 disabled:opacity-60">
              {busy ? "Opening" : "Open"}
            </button>
          </Form>
        )}
        <p className="mt-8 text-sm text-muted">
          Need help? <a className="text-accent-ink underline" href={`mailto:${b("link.email")}`}>{b("link.email")}</a>
        </p>
      </div>
    </main>
  );
}
