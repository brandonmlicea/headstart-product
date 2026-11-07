import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createCookieSessionStorage, redirect } from "react-router";
import form from "../../blanks.json";

type Field = { ask: string; env?: string };
const fields = Object.entries(form.blanks as Record<string, Field>).filter(([, f]) => f.env);

export function env(name: string): string {
  const file = existsSync(".env") ? (parseEnv(readFileSync(".env", "utf8")) as Record<string, string>) : {};
  return (process.env[name] ?? file[name] ?? "").trim();
}

export function missingEnv(names: string[]) {
  return fields.filter(([, f]) => names.includes(f.env!) && !env(f.env!)).map(([key, f]) => `REQUIRED: ${f.ask} (${f.env}). Run ./fill ${key}="..."`);
}

function sessions() {
  const secret = env("SESSION_SECRET");
  if (!secret) throw new Response(missingEnv(["SESSION_SECRET"]).join("\n"), { status: 503 });
  return createCookieSessionStorage({
    cookie: { name: "__care", httpOnly: true, sameSite: "lax", path: "/", secrets: [secret], secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30 },
  });
}

export async function signedIn(request: Request) {
  const s = await sessions().getSession(request.headers.get("Cookie"));
  return s.get("in") === true;
}

export async function requireIn(request: Request) {
  if (!(await signedIn(request))) throw redirect(`/login?next=${encodeURIComponent(new URL(request.url).pathname)}`);
}

export async function signIn(request: Request, next: string) {
  const store = sessions();
  const s = await store.getSession(request.headers.get("Cookie"));
  s.set("in", true);
  return redirect(next.startsWith("/") ? next : "/", { headers: { "Set-Cookie": await store.commitSession(s) } });
}

export async function signOut(request: Request) {
  const store = sessions();
  const s = await store.getSession(request.headers.get("Cookie"));
  return redirect("/login", { headers: { "Set-Cookie": await store.destroySession(s) } });
}

export function ai() {
  const gaps = missingEnv(["AI_BASE_URL", "AI_API_KEY", "AI_MODEL"]);
  return { gaps, base: env("AI_BASE_URL").replace(/\/+$/, ""), key: env("AI_API_KEY"), model: env("AI_MODEL"), transcribe: env("AI_TRANSCRIBE_MODEL") };
}
