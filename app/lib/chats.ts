import { useSyncExternalStore } from "react";

export type Msg = { role: "user" | "assistant"; text: string; images?: string[]; error?: boolean };
export type Chat = { id: string; title: string; at: number; messages: Msg[]; busy?: boolean };

const KEY = "headstart.chats";
const EMPTY: Chat[] = [];
const subs = new Set<() => void>();
let chats: Chat[] = EMPTY;
let loaded = false;

function load() {
  if (loaded || typeof localStorage === "undefined") return;
  loaded = true;
  try { chats = JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { chats = []; }
}

function persist() {
  const clean = chats.map((c) => ({ ...c, busy: false }));
  try {
    localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    const light = clean.map((c, i) => (i === 0 ? c : { ...c, messages: c.messages.map(({ images, ...m }) => ({ ...m, text: images?.length ? `${m.text} [photo]` : m.text })) }));
    try { localStorage.setItem(KEY, JSON.stringify(light)); } catch {}
  }
}

function put(chat: Chat, save = true) {
  chats = chats.some((c) => c.id === chat.id) ? chats.map((c) => (c.id === chat.id ? chat : c)) : [chat, ...chats];
  if (save) persist();
  subs.forEach((f) => f());
}

export function useChats() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => { load(); return chats; },
    () => EMPTY,
  );
}

export function remove(id: string) {
  chats = chats.filter((c) => c.id !== id);
  persist();
  subs.forEach((f) => f());
}

export function send(id: string | undefined, text: string, images: string[]) {
  load();
  const found = chats.find((c) => c.id === id);
  const chat: Chat = found ?? { id: crypto.randomUUID().slice(0, 8), title: text.split("\n")[0].slice(0, 60) || "Photo", at: Date.now(), messages: [] };
  const next = { ...chat, at: Date.now(), busy: true, messages: [...chat.messages, { role: "user" as const, text, images }, { role: "assistant" as const, text: "" }] };
  put(next);
  void stream(next);
  return next.id;
}

async function stream(chat: Chat) {
  const history = chat.messages.slice(0, -1).filter((m) => !m.error).map(({ role, text, images }) => ({ role, text, images }));
  let current = chat;
  const reply = (patch: Partial<Msg>, done = false) => {
    current = { ...current, busy: !done, messages: [...current.messages.slice(0, -1), { ...current.messages.at(-1)!, ...patch }] };
    put(current, done);
  };
  try {
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
    if (!res.ok || !res.body) return reply({ text: await res.text(), error: true }, true);
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += value;
      reply({ text });
    }
    reply({ text: text || "The model sent an empty answer." , error: !text }, true);
  } catch (e) {
    reply({ text: `Could not reach the assistant: ${e instanceof Error ? e.message : e}`, error: true }, true);
  }
}

export async function shrink(file: File, max = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}
