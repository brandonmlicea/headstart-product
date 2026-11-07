import type { Route } from "./+types/api.chat";
import { ai, signedIn } from "~/lib/env.server";
import { b } from "~/lib/blanks";

type Msg = { role: "user" | "assistant"; text: string; images?: string[] };

const content = (m: Msg) =>
  m.images?.length
    ? [{ type: "text", text: m.text || "Look at this image." }, ...m.images.map((url) => ({ type: "image_url", image_url: { url } }))]
    : m.text;

export async function action({ request }: Route.ActionArgs) {
  if (!(await signedIn(request))) return new Response("Sign in first.", { status: 401 });
  const cfg = ai();
  if (cfg.gaps.length) return new Response(cfg.gaps.join("\n"), { status: 503 });
  const { messages } = (await request.json()) as { messages: Msg[] };
  const res = await fetch(`${cfg.base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({
      model: cfg.model,
      stream: true,
      messages: [{ role: "system", content: `${b("assistant.role")}\n\nYour name is ${b("assistant.name")}.` }, ...messages.map((m) => ({ role: m.role, content: content(m) }))],
    }),
    signal: request.signal,
  });
  if (!res.ok || !res.body) return new Response(`The AI API answered ${res.status}: ${(await res.text()).slice(0, 500)}`, { status: 502 });
  const decoder = new TextDecoder();
  let buffer = "";
  const text = new TransformStream<Uint8Array, string>({
    transform(chunk, out) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const data = line.trim().replace(/^data:\s*/, "");
        if (!line.trim().startsWith("data:") || data === "[DONE]") continue;
        try {
          const delta = JSON.parse(data).choices?.[0]?.delta?.content;
          if (delta) out.enqueue(delta);
        } catch {}
      }
    },
  });
  return new Response(res.body.pipeThrough(text).pipeThrough(new TextEncoderStream()), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
