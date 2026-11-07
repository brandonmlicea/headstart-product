import { useNavigate, useParams, useRouteLoaderData } from "react-router";
import { b, ems } from "~/lib/blanks";
import { send, useChats } from "~/lib/chats";
import { Composer } from "~/components/composer";
import { Thread } from "~/components/thread";

const STARTERS = [b("starter.1"), b("starter.2"), b("starter.3")];

export default function Home() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chat = useChats().find((c) => c.id === id);
  const name = b("assistant.name");
  const me = useRouteLoaderData("routes/shell") as { profile: { name: string } } | undefined;

  const onSend = (text: string, images: string[]) => {
    const next = send(chat?.id, text, images);
    if (next !== id) navigate(`/c/${next}`);
  };

  const composer = (
    <>
      <Composer placeholder={`Ask ${name}, talk, or add a photo`} busy={!!chat?.busy} onSend={onSend} />
      <p id="chat-disclaimer" className="mx-auto mt-2 max-w-2xl px-2 text-center text-[12px] text-muted">{b("assistant.disclaimer")}</p>
    </>
  );

  if (!chat)
    return (
      <main id="page-home" className="dots flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
        <p className="eyebrow">{name}{me ? ` · ${me.profile.name}` : ""}</p>
        <h1 className="mt-5 max-w-[20ch] text-center text-h2 text-ink">
          {ems(b("assistant.greeting")).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part))}
        </h1>
        <p className="mt-4 max-w-md text-center text-body text-body">{id ? "This chat is not on this device. Start a new one below." : b("assistant.intro")}</p>
        <div className="mt-10 w-full">{composer}</div>
        <div id="starters" className="mx-auto mt-6 grid w-full max-w-2xl gap-2">
          {STARTERS.map((s, i) => (
            <button key={s} onClick={() => onSend(s, [])} className="row flex items-center gap-3 px-4 py-3 text-left transition hover:bg-raised">
              <span className="w-6 font-mono text-[11px] text-muted">1.{i + 1}</span>
              <span className="flex-1 text-row font-medium text-ink">{s}</span>
              <span className="text-muted" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </main>
    );

  return (
    <main id="page-chat" className="flex min-h-0 flex-1 flex-col">
      <header id="chat-title" className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-5 text-[13px]">
        <span className="font-mono text-[10px] text-muted">::</span>
        <span className="truncate text-ink">{chat.title}</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Thread messages={chat.messages} name={name} busy={!!chat.busy} />
      </div>
      <div className="shrink-0 px-4 pb-4">{composer}</div>
    </main>
  );
}
