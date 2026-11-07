import { useEffect, useRef, useState } from "react";
import { shrink } from "~/lib/chats";
import { Icon } from "./icon";

type Props = { placeholder: string; busy: boolean; onSend: (text: string, images: string[]) => void };

const tool = "grid size-8 place-items-center rounded-md text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-40";

export function Composer({ placeholder, busy, onSend }: Props) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [rec, setRec] = useState<{ recorder: MediaRecorder; started: number } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSeconds(Math.round((Date.now() - rec.started) / 1000)), 250);
    return () => clearInterval(t);
  }, [rec]);

  const addFiles = async (list: FileList | File[] | null) => {
    const picked = [...(list ?? [])].filter((f) => f.type.startsWith("image/")).slice(0, 6);
    const urls = await Promise.all(picked.map((f) => shrink(f)));
    setImages((now) => [...now, ...urls].slice(0, 6));
  };

  const submit = () => {
    if (busy || (!text.trim() && !images.length)) return;
    onSend(text.trim(), images);
    setText("");
    setImages([]);
  };

  const record = async () => {
    if (rec) return rec.recorder.stop();
    setNote("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRec(null);
        setNote("Writing down what you said");
        const type = recorder.mimeType || "audio/webm";
        const body = new FormData();
        body.append("audio", new File(chunks, `speech.${type.includes("mp4") ? "mp4" : "webm"}`, { type }));
        const res = await fetch("/api/transcribe", { method: "POST", body });
        if (!res.ok) return setNote(await res.text());
        const { text: said } = (await res.json()) as { text: string };
        setNote("");
        setText((now) => (now ? `${now} ${said}` : said).trim());
        area.current?.focus();
      };
      recorder.start();
      setSeconds(0);
      setRec({ recorder, started: Date.now() });
    } catch {
      setNote("The microphone is blocked. Allow it in the browser's site settings.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        id="composer"
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); void addFiles(e.dataTransfer.files); }}
        className="rounded-[12px] border border-line bg-raised shadow-[inset_0_1px_0_oklch(1_0_0/0.7),0_1px_3px_oklch(0_0_0/0.05),0_12px_32px_-16px_oklch(0_0_0/0.18)] transition focus-within:border-accent-ink/50"
      >
        {images.length > 0 && (
          <div id="composer-images" className="flex gap-2 overflow-x-auto px-3 pt-3">
            {images.map((src, i) => (
              <div key={i} className="relative shrink-0">
                <img src={src} alt={`Attachment ${i + 1}`} className="size-16 rounded-lg object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-canvas" aria-label="Remove photo">
                  <Icon name="x" className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={area}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => { if (e.clipboardData.files.length) { e.preventDefault(); void addFiles(e.clipboardData.files); } }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
          placeholder={placeholder}
          aria-label="Message"
          className="block max-h-56 w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-[15px] text-ink outline-none placeholder:text-muted"
        />
        <div id="composer-bar" className="flex items-center gap-1 p-2">
          <input ref={files} type="file" accept="image/*" multiple hidden onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
          <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
          <button id="composer-attach" type="button" className={tool} onClick={() => files.current?.click()} title="Add photos or handwriting" aria-label="Add photos"><Icon name="clip" /></button>
          <button id="composer-camera" type="button" className={tool} onClick={() => camera.current?.click()} title="Take a photo" aria-label="Take a photo"><Icon name="camera" /></button>
          <button
            id="composer-mic"
            type="button"
            onClick={record}
            className={rec ? "flex h-8 items-center gap-2 rounded-md bg-tone-4 px-2.5 text-[13px] text-tone-4-ink" : tool}
            title={rec ? "Stop and write it down" : "Talk instead of typing"}
            aria-label={rec ? "Stop recording" : "Record your voice"}
          >
            <Icon name={rec ? "stop" : "mic"} className={rec ? "size-4" : "size-5"} />
            {rec && <span className="tabular-nums">0:{String(seconds).padStart(2, "0")}</span>}
          </button>
          {note && <span className="truncate px-2 text-[12px] text-muted" role="status">{note}</span>}
          <button id="composer-send" disabled={busy || (!text.trim() && !images.length)} className="btn btn-dark ml-auto grid size-8 place-items-center p-0 disabled:opacity-40" aria-label="Send">
            <Icon name="send" className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
