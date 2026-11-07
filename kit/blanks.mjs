import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parse, FORMATS } from "./color.mjs";
import { palette, css } from "./palette.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHARED = /^(brand|link)\./;
const FILLER = /\blorem\b|\bipsum\b|\b(john|jane) (doe|smith)\b|\bacme\b|example\.(com|org|net)|\bfoo\b|\bplaceholder\b|\btbd\b|\btodo\b|\bxxx+\b|\byour (company|brand|startup|product|name)\b|^\s*optional\b|\brequired:|\binsert\b|\{\{|\}\}|^\s*(n\/?a|none|null|undefined|-+|\.+)\s*$/i;

export function load(root = ROOT) {
  const file = join(root, "blanks.json");
  if (!existsSync(file)) throw new Error(`No blanks.json in ${root}`);
  return { root, file, form: JSON.parse(readFileSync(file, "utf8")) };
}

const save = (site) => writeFileSync(site.file, JSON.stringify(site.form, null, 2) + "\n");

function readEnv(root) {
  const f = join(root, ".env");
  if (!existsSync(f)) return {};
  return Object.fromEntries(readFileSync(f, "utf8").split(/\r?\n/).filter((l) => /^\s*[A-Z0-9_]+\s*=/.test(l)).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
  }));
}

function writeEnv(root, key, value) {
  const env = { ...readEnv(root), [key]: value };
  writeFileSync(join(root, ".env"), Object.entries(env).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join("\n") + "\n");
}

export function valueOf(site, key) {
  const f = site.form.blanks[key];
  return (f.env ? process.env[f.env] ?? readEnv(site.root)[f.env] : f.value)?.trim() ?? "";
}

export function validate(f, value) {
  const v = String(value ?? "").trim();
  if (!v) return `${f.ask} is REQUIRED`;
  if (f.kind !== "secret" && FILLER.test(v)) return `"${v}" is generic filler. Write the real ${f.ask}`;
  if (v.toLowerCase() === f.ask.toLowerCase()) return `Write the real ${f.ask}, not its label`;
  if (f.max && v.length > f.max) return `${f.ask} must be at most ${f.max} characters (got ${v.length})`;
  if (f.min && v.length < f.min) return `${f.ask} must be at least ${f.min} characters (got ${v.length})`;
  if (f.kind === "color") { try { parse(v); } catch (e) { return `${f.ask}: ${e.message}`; } }
  if (f.kind === "format" && !FORMATS.includes(v)) return `${f.ask} must be one of ${FORMATS.join(", ")}`;
  if (f.kind === "choice" && !f.options.includes(v)) return `${f.ask} must be one of ${f.options.join(", ")}`;
  if (f.kind === "email" && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) return `${f.ask} must be an email address`;
  if (f.kind === "url" && !/^https?:\/\/[^\s]+$/i.test(v)) return `${f.ask} must start with http:// or https://`;
  if (f.kind === "phone" && (v.match(/\d/g) || []).length < 7) return `${f.ask} must be a phone number`;
  return null;
}

export function missing(site) {
  return Object.entries(site.form.blanks).flatMap(([key, f]) => {
    if (f.generate && !valueOf(site, key)) return [];
    const error = validate(f, valueOf(site, key));
    return error ? [{ key, ...describe(f), error }] : [];
  });
}

export function describe(f) {
  const { value, ...rest } = f;
  return rest;
}

export function list(site, all = false) {
  if (!all) return missing(site);
  return Object.entries(site.form.blanks).map(([key, f]) => ({
    key, ...describe(f), value: f.kind === "secret" && valueOf(site, key) ? "(set)" : valueOf(site, key),
  }));
}

export function pairOf(site) {
  const tries = [site.form.pair && resolve(site.root, site.form.pair)].filter(Boolean);
  const parent = dirname(site.root);
  for (const d of readdirSync(parent)) tries.push(join(parent, d));
  for (const d of tries) {
    if (d === site.root || !existsSync(join(d, "blanks.json"))) continue;
    const other = load(d);
    if (other.form.site !== site.form.site) return other;
  }
  return null;
}

export function writeTokens(site) {
  const color = valueOf(site, "brand.color"), fmt = valueOf(site, "brand.format") || "oklch";
  let p;
  try { p = palette(color || "#6b7280", FORMATS.includes(fmt) ? fmt : "oklch"); } catch { p = palette("#6b7280", "oklch"); }
  const out = join(site.root, site.form.tokens);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, css(p));
  return { file: relative(site.root, out), pass: p.pass, failing: p.report.filter((r) => !r.pass) };
}

function setOne(site, key, value) {
  const f = site.form.blanks[key];
  if (!f) return `No blank named ${key}. Run ./fill list --all to see every key`;
  const error = validate(f, value);
  if (error) return error;
  if (f.env) writeEnv(site.root, f.env, String(value).trim());
  else f.value = String(value).trim();
  return null;
}

export function fill(site, values, { propagate = true } = {}) {
  const errors = {}, set = [];
  for (const [k, v] of Object.entries(values)) {
    const e = setOne(site, k, v);
    if (e) errors[k] = e; else set.push(k);
  }
  for (const [key, f] of Object.entries(site.form.blanks))
    if (f.generate && f.env && !valueOf(site, key)) { writeEnv(site.root, f.env, randomBytes(24).toString("hex")); set.push(key); }
  save(site);
  const result = { site: site.form.site, set, errors, remaining: missing(site).length };
  if (set.some((k) => k.startsWith("brand."))) result.tokens = writeTokens(site);
  const shared = Object.fromEntries(set.filter((k) => SHARED.test(k) && !site.form.blanks[k].env).map((k) => [k, site.form.blanks[k].value]));
  const pair = propagate && Object.keys(shared).length ? pairOf(site) : null;
  if (pair) {
    const known = Object.fromEntries(Object.entries(shared).filter(([k]) => pair.form.blanks[k]));
    result.pair = { root: pair.root, ...fill(pair, known, { propagate: false }) };
  }
  return result;
}

export function sync(site, push = false) {
  const pair = pairOf(site);
  if (!pair) return { error: "No paired site found next to this one. Clone the other repo beside it." };
  const [from, to] = push ? [site, pair] : [pair, site];
  const values = Object.fromEntries(Object.entries(from.form.blanks)
    .filter(([k, f]) => SHARED.test(k) && !f.env && f.value && to.form.blanks[k]).map(([k, f]) => [k, f.value]));
  return { from: from.root, to: to.root, ...fill(to, values, { propagate: false }) };
}

function walk(dir, out = []) {
  for (const d of readdirSync(dir)) {
    if (/^(node_modules|dist|build|\.\w+)$/.test(d)) continue;
    const p = join(dir, d);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|tsx?|jsx?|mdx?)$/.test(d)) out.push(p);
  }
  return out;
}

export function map(site) {
  const files = {}, used = new Set();
  for (const p of walk(join(site.root, site.form.src))) {
    const keys = [...readFileSync(p, "utf8").matchAll(/\bb\(\s*["'`]([\w.-]+)["'`]/g)].map((m) => m[1]);
    const n = [...readFileSync(p, "utf8").matchAll(/\bb\(\s*`([\w.-]*)\$\{/g)].map((m) => `${m[1]}*`);
    if (keys.length || n.length) files[relative(site.root, p).replaceAll("\\", "/")] = [...new Set([...keys, ...n])];
    keys.forEach((k) => used.add(k));
  }
  const unknown = [...used].filter((k) => !site.form.blanks[k]);
  return { site: site.form.site, routes: site.form.routes, files, unknown };
}

export function check(site) {
  const gaps = missing(site), t = writeTokens(site), m = map(site);
  return { ok: !gaps.length && t.pass && !m.unknown.length, missing: gaps, tokens: t, unknown: m.unknown };
}
