import form from "../../blanks.json";

type Field = { ask: string; value?: string };
export type Blank = keyof typeof form.blanks;

export function b(key: Blank): string {
  const f = (form.blanks as Record<string, Field>)[key];
  if (!f) throw new Error(`blanks.json has no ${key}`);
  return f.value?.trim() || `REQUIRED: ${f.ask}`;
}

export const ems = (s: string) => s.split(/\*([^*]+)\*/);

export const list = (key: Blank) => b(key).split(",").map((s) => s.trim()).filter(Boolean);
