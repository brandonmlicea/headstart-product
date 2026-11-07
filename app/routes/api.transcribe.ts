import type { Route } from "./+types/api.transcribe";
import { ai, missingEnv, profileOf } from "~/lib/env.server";

export async function action({ request }: Route.ActionArgs) {
  if (!(await profileOf(request))) return new Response("Finish the welcome questions first.", { status: 401 });
  const cfg = ai();
  const gaps = missingEnv(["AI_BASE_URL", "AI_API_KEY", "AI_TRANSCRIBE_MODEL"]);
  if (gaps.length) return new Response(gaps.join("\n"), { status: 503 });
  const audio = (await request.formData()).get("audio");
  if (!(audio instanceof File)) return new Response("Send the recording as the audio field.", { status: 400 });
  const body = new FormData();
  body.append("file", audio, audio.name || "speech.webm");
  body.append("model", cfg.transcribe);
  const res = await fetch(`${cfg.base}/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${cfg.key}` }, body });
  if (!res.ok) return new Response(`Transcription answered ${res.status}: ${(await res.text()).slice(0, 500)}`, { status: 502 });
  const { text = "" } = (await res.json()) as { text?: string };
  return Response.json({ text });
}
