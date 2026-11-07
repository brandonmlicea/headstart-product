import { createCookie, redirect } from "react-router";
import form from "../../blanks.json";

type Field = { ask: string; env?: string };
const fields = Object.entries(form.blanks as Record<string, Field>).filter(([, f]) => f.env);

export function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function missingEnv(names: string[]) {
  return fields.filter(([, f]) => names.includes(f.env!) && !env(f.env!)).map(([key, f]) => `REQUIRED: ${f.ask} (${f.env}). Run ./fill ${key}="..."`);
}

export type Profile = { name: string; a1: string; a2: string[]; a3: string };

const cookie = (request: Request) =>
  createCookie("__profile", { path: "/", sameSite: "lax", httpOnly: true, secure: new URL(request.url).protocol === "https:", maxAge: 60 * 60 * 24 * 365 });

export async function profileOf(request: Request): Promise<Profile | null> {
  const p = await cookie(request).parse(request.headers.get("Cookie"));
  return p && typeof p.name === "string" ? (p as Profile) : null;
}

export async function requireProfile(request: Request) {
  const p = await profileOf(request);
  if (!p) throw redirect("/welcome");
  return p;
}

export async function saveProfile(request: Request, p: Profile) {
  return redirect("/", { headers: { "Set-Cookie": await cookie(request).serialize(p) } });
}

export async function clearProfile(request: Request) {
  return redirect("/welcome", { headers: { "Set-Cookie": await cookie(request).serialize("", { maxAge: 0 }) } });
}

export function ai() {
  const gaps = missingEnv(["AI_BASE_URL", "AI_API_KEY", "AI_MODEL"]);
  return { gaps, base: env("AI_BASE_URL").replace(/\/+$/, ""), key: env("AI_API_KEY"), model: env("AI_MODEL"), transcribe: env("AI_TRANSCRIBE_MODEL") };
}
