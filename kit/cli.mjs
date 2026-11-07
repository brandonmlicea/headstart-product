#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { load, list, fill, check, sync, map, writeTokens, valueOf, validate } from "./blanks.mjs";
import { parse, every, measure, fix } from "./color.mjs";
import { palette } from "./palette.mjs";

const HELP = `./fill                      walk the form in the terminal (prints it when run by an agent)
./fill list [--all] [--json] blanks still REQUIRED (or every blank)
./fill key="value" ...       fill blanks; brand.* and link.* also fill the paired site
./fill --from answers.json   fill many blanks from a {"key": "value"} file
./fill check                 exit 1 while any blank is REQUIRED or a color pair fails AA
./fill tokens [--format f]   rewrite the color tokens (hex rgb srgb hsl oklch oklab lab lch p3)
./fill convert <color>       one color in every format
./fill contrast <text> <bg>  WCAG and APCA, with the nearest passing fix
./fill sync [--push]         pull brand.* and link.* from the paired site (or push them)
./fill map                   which file uses which blank, and the routes
./fill mcp                   start the MCP server on stdio`;

const site = load();
const [cmd = "", ...rest] = process.argv.slice(2);
const flag = (n) => rest.includes(n);
const opt = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined; };
const show = (o) => console.log(JSON.stringify(o, null, 2));

function printForm(gaps) {
  if (!gaps.length) return console.log(`${site.form.site}: every blank is filled.`);
  console.log(`${site.form.site}: ${gaps.length} blank(s) REQUIRED. Fill each with real words, never filler:\n`);
  for (const g of gaps) {
    console.log(`  ${g.key}${g.env ? `  (.env ${g.env})` : ""}\n    ask:  ${g.ask}${g.hint ? `\n    hint: ${g.hint}` : ""}${g.max ? `\n    max:  ${g.max} chars` : ""}${g.options ? `\n    one of: ${g.options.join(", ")}` : ""}`);
  }
  console.log(`\nFill them: ./fill key="value" key2="value"   or   ./fill --from answers.json`);
}

function report(r) {
  for (const k of r.set ?? []) console.log(`  set ${k}`);
  for (const [k, e] of Object.entries(r.errors ?? {})) console.log(`  REJECTED ${k}: ${e}`);
  if (r.tokens) console.log(`  tokens -> ${r.tokens.file} (${r.tokens.pass ? "every text pair passes AA" : "FAILS AA"})`);
  if (r.pair) { console.log(`  paired site ${r.pair.root}:`); report(r.pair); }
  if (r.remaining !== undefined) console.log(`  ${r.site}: ${r.remaining} blank(s) still REQUIRED`);
}

async function walkForm() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  for (const g of list(site)) {
    const f = site.form.blanks[g.key];
    for (;;) {
      const now = valueOf(site, g.key);
      const a = (await rl.question(`\n${f.ask}${f.hint ? `\n  ${f.hint}` : ""}${f.options ? `\n  one of: ${f.options.join(", ")}` : ""}\n> `)).trim() || now;
      const e = validate(f, a);
      if (e) { console.log(`  ${e}`); continue; }
      report(fill(site, { [g.key]: a }));
      break;
    }
  }
  rl.close();
  printForm(list(site));
}

const pairs = [cmd, ...rest].filter((a) => /^[\w.-]+=/.test(a));
if (pairs.length) {
  const values = Object.fromEntries(pairs.map((a) => [a.slice(0, a.indexOf("=")), a.slice(a.indexOf("=") + 1)]));
  const r = fill(site, values);
  report(r);
  process.exit(Object.keys(r.errors).length ? 1 : 0);
}

switch (cmd) {
  case "":
    if (process.stdin.isTTY && process.stdout.isTTY) await walkForm(); else printForm(list(site));
    break;
  case "list":
    flag("--json") ? show(list(site, flag("--all"))) : flag("--all") ? show(list(site, true)) : printForm(list(site));
    break;
  case "--from": case "from": {
    const r = fill(site, JSON.parse(readFileSync(rest[0], "utf8")));
    report(r);
    process.exit(Object.keys(r.errors).length ? 1 : 0);
  }
  case "check": {
    const r = check(site);
    if (r.missing.length) printForm(r.missing);
    for (const f of r.tokens.failing) console.log(`  AA FAIL ${f.scheme} ${f.text} on ${f.background}: ${f.wcag}:1, Lc ${f.apca}`);
    for (const k of r.unknown) console.log(`  code uses b("${k}") but blanks.json has no ${k}`);
    console.log(r.ok ? `${site.form.site}: ready. Every blank filled, every color pair passes AA.` : `${site.form.site}: not ready.`);
    process.exit(r.ok ? 0 : 1);
  }
  case "tokens": {
    if (opt("--format")) report(fill(site, { "brand.format": opt("--format") }));
    const t = writeTokens(site);
    const p = palette(valueOf(site, "brand.color") || "#6b7280", valueOf(site, "brand.format") || "oklch");
    console.table(p.report.map(({ scheme, text, background, wcag, apca, pass }) => ({ scheme, pair: `${text} on ${background}`, wcag, apca, pass })));
    console.log(`${t.file}: ${t.pass ? "every text pair passes AA" : "FAILS AA"}`);
    break;
  }
  case "convert":
    show(every(parse(rest.join(" "))));
    break;
  case "contrast": {
    const [t, b] = [parse(rest[0]), parse(rest[1])];
    const m = measure(t, b);
    show({ ...m, fix: m.pass ? null : every(fix(t, b)), goal: "AA: WCAG 4.5:1 and APCA Lc 60" });
    break;
  }
  case "sync": { const r = sync(site, flag("--push")); r.error ? console.log(r.error) : report(r); break; }
  case "map": show(map(site)); break;
  case "mcp": await import("./mcp.mjs"); break;
  case "help": case "--help": case "-h": console.log(HELP); break;
  default: console.log(`Unknown command ${cmd}\n\n${HELP}`); process.exit(1);
}

