import { createInterface } from "node:readline";
import { load, list, fill, check, sync, map, pairOf } from "./blanks.mjs";
import { parse, every, measure, fix } from "./color.mjs";
import { palette } from "./palette.mjs";

const here = load();
const SITE = { type: "string", enum: ["this", "pair", "both"], description: "this site, the paired site, or both (default both)" };

function sites(which = "both") {
  const pair = pairOf(here);
  const out = which === "pair" ? [pair] : which === "this" ? [here] : [here, pair];
  return out.filter(Boolean);
}

const TOOLS = {
  blanks: {
    description: "The form: every blank still REQUIRED on the landing and the product (key, ask, hint, max length, kind). Fill them with fill. all=true lists filled ones too.",
    inputSchema: { type: "object", properties: { site: SITE, all: { type: "boolean" } } },
    run: ({ site, all }) => sites(site).map((s) => ({ site: s.form.site, root: s.root, blanks: list(s, all) })),
  },
  fill: {
    description: "Fill blanks with real words ({\"brand.name\": \"...\"}). Generic filler (Lorem, John Doe, Acme, optional, TBD) is rejected. brand.* and link.* also fill the paired site, and brand.color or brand.format rewrites both sites' color tokens.",
    inputSchema: { type: "object", properties: { values: { type: "object", additionalProperties: { type: "string" } }, site: { type: "string", enum: ["this", "pair"] } }, required: ["values"] },
    run: ({ values, site = "this" }) => fill(sites(site)[0], values),
  },
  check: {
    description: "Is each site ready to build: no blank REQUIRED, every text color pair passes AA (WCAG 4.5:1 and APCA Lc 60), every key the code uses exists.",
    inputSchema: { type: "object", properties: { site: SITE } },
    run: ({ site }) => sites(site).map((s) => ({ site: s.form.site, ...check(s) })),
  },
  map: {
    description: "Where things are: each site's routes and which file uses which blank, so you can jump to the right file.",
    inputSchema: { type: "object", properties: { site: SITE } },
    run: ({ site }) => sites(site).map((s) => ({ root: s.root, ...map(s) })),
  },
  sync: {
    description: "Copy brand.* and link.* from one site to the other so both match. push=false pulls from the pair into this site.",
    inputSchema: { type: "object", properties: { push: { type: "boolean" } } },
    run: ({ push }) => sync(here, push),
  },
  palette: {
    description: "Preview the token palette (light and dark) for any CSS color in a chosen format, with its contrast report. Writes nothing.",
    inputSchema: { type: "object", properties: { color: { type: "string" }, format: { type: "string", enum: ["hex", "rgb", "srgb", "hsl", "oklch", "oklab", "lab", "lch", "p3"] } }, required: ["color"] },
    run: ({ color, format }) => palette(color, format),
  },
  convert: {
    description: "One CSS color (hex, rgb, hsl, oklch, oklab, lab, lch, color(srgb|display-p3 ...)) in every format.",
    inputSchema: { type: "object", properties: { color: { type: "string" } }, required: ["color"] },
    run: ({ color }) => every(parse(color)),
  },
  contrast: {
    description: "WCAG ratio and APCA Lc of text on a background, and the nearest passing text color at the same hue.",
    inputSchema: { type: "object", properties: { text: { type: "string" }, background: { type: "string" } }, required: ["text", "background"] },
    run: ({ text, background }) => {
      const t = parse(text), b = parse(background), m = measure(t, b);
      return { ...m, fix: m.pass ? null : every(fix(t, b)) };
    },
  },
};

const send = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");

function handle(req) {
  const { id, method, params = {} } = req;
  if (method === "initialize")
    return send({ id, result: { protocolVersion: params.protocolVersion ?? "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: `headstart-${here.form.site}`, version: "1.0.0" }, instructions: "Headstart: fill the landing and product templates through blanks and fill, keep both sites' colors in step, and check before building." } });
  if (method === "tools/list")
    return send({ id, result: { tools: Object.entries(TOOLS).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })) } });
  if (method === "tools/call") {
    const tool = TOOLS[params.name];
    if (!tool) return send({ id, error: { code: -32602, message: `Unknown tool ${params.name}` } });
    try {
      return send({ id, result: { content: [{ type: "text", text: JSON.stringify(tool.run(params.arguments ?? {}), null, 2) }] } });
    } catch (e) {
      return send({ id, result: { isError: true, content: [{ type: "text", text: String(e.message ?? e) }] } });
    }
  }
  if (method === "ping") return send({ id, result: {} });
  if (id !== undefined) send({ id, error: { code: -32601, message: `Unknown method ${method}` } });
}

createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  try { handle(JSON.parse(line)); } catch (e) { send({ id: null, error: { code: -32700, message: String(e.message) } }); }
});
