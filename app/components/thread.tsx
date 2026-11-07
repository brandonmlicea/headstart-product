import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { Msg } from "~/lib/chats";
import { Icon } from "./icon";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>));
}

function Prose({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) {
          const Tag = /^\s*\d+\./.test(lines[0]) ? "ol" : "ul";
          return (
            <Tag key={i} className={`space-y-1 pl-5 ${Tag === "ol" ? "list-decimal" : "list-disc"}`}>
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</li>)}
            </Tag>
          );
        }
        if (/^#{1,4}\s/.test(block)) return <p key={i} className="font-semibold">{inline(block.replace(/^#+\s*/, ""))}</p>;
        return <p key={i} className="whitespace-pre-wrap">{inline(block)}</p>;
      })}
    </div>
  );
}

function Speak({ text }: { text: string }) {
  const [on, setOn] = useState(false);
  const toggle = () => {
    speechSynthesis.cancel();
    if (on) return setOn(false);
    const u = new SpeechSynthesisUtterance(text.replace(/[*#`_]/g, ""));
    u.onend = u.onerror = () => setOn(false);
    speechSynthesis.speak(u);
    setOn(true);
  };
  return (
    <button onClick={toggle} className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition hover:bg-ink/5 ${on ? "text-accent-ink" : "text-muted"}`}>
      <Icon name={on ? "stop" : "speaker"} className="size-4" /> {on ? "Stop" : "Read aloud"}
    </button>
  );
}

export function Thread({ messages, name, busy }: { messages: Msg[]; name: string; busy: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  const last = messages.at(-1)?.text.length ?? 0;
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages.length, last]);
  return (
    <div id="chat-thread" className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
      {messages.map((m, i) =>
        m.role === "user" ? (
          <div key={i} className="ml-auto flex max-w-[85%] flex-col items-end gap-2">
            {m.images && m.images.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2">
                {m.images.map((src, j) => <img key={j} src={src} alt={`Photo ${j + 1}`} className="max-h-48 rounded-xl border border-line object-cover" />)}
              </div>
            )}
            {m.text && <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-surface px-4 py-2.5">{m.text}</div>}
          </div>
        ) : (
          <div key={i} className="group">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-accent-ink"><Icon name="heart" className="size-4" />{name}</p>
            {m.error ? (
              <pre className="whitespace-pre-wrap rounded-xl border border-line bg-surface p-4 font-sans text-sm">{m.text}</pre>
            ) : m.text ? (
              <Prose text={m.text} />
            ) : (
              <p className="animate-pulse text-muted">Thinking it through</p>
            )}
            {m.text && !m.error && !(busy && i === messages.length - 1) && (
              <div className="mt-2 flex gap-1 opacity-70 transition group-hover:opacity-100">
                <Speak text={m.text} />
                <button onClick={() => navigator.clipboard.writeText(m.text)} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-ink/5"><Icon name="copy" className="size-4" /> Copy</button>
              </div>
            )}
          </div>
        ),
      )}
      <div ref={end} />
    </div>
  );
}
