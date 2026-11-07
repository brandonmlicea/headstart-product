const mul = (m, v) => m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const SRGB_XYZ = [[0.4123907992659595, 0.357584339383878, 0.1804807884018343], [0.21263900587151036, 0.715168678767756, 0.07219231536073371], [0.01933081871559185, 0.11919477979462599, 0.9505321522496606]];
const XYZ_SRGB = [[3.2409699419045226, -1.537383177570094, -0.4986107602930034], [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559], [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]];
const P3_XYZ = [[0.4865709486482162, 0.26566769316909306, 0.1982172852343625], [0.2289745640697488, 0.6917385218365064, 0.079286914093745], [0, 0.04511338185890264, 1.043944368900976]];
const XYZ_P3 = [[2.493496911941425, -0.9313836179191239, -0.40271078445071684], [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577], [0.03584583024378447, -0.07617238926804182, 0.9568845240076872]];
const XYZ_LMS = [[0.819022437996703, 0.3619062600528904, -0.1288737815209879], [0.0329836539323885, 0.9292868615863434, 0.0361446663506424], [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]];
const LMS_LAB = [[0.210454268309314, 0.7936177747023054, -0.0040720430116193], [1.9779985324311684, -2.42859224204858, 0.450593709617411], [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]];
const LAB_LMS = [[1, 0.3963377773761749, 0.2158037573099136], [1, -0.1055613458156586, -0.0638541728258133], [1, -0.0894841775298119, -1.2914855480194092]];
const LMS_XYZ = [[1.2268798758459243, -0.5578149944602171, 0.2813910456659647], [-0.0405757452148008, 1.112286803280317, -0.0717110580655164], [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]];
const D65_D50 = [[1.0479298208405488, 0.022946793341019088, -0.05019222954313557], [0.029627815688159344, 0.990434484573249, -0.01707382502938514], [-0.009243058152591178, 0.015055144896577895, 0.7518742899580008]];
const D50_D65 = [[0.9554734527042182, -0.023098536874261423, 0.0632593086610217], [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008], [0.012314001688319899, -0.020507696433477912, 1.3303659366080753]];
const D50 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585];

const toLin = (c) => { const a = Math.abs(c); return Math.sign(c) * (a <= 0.04045 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4); };
const toGam = (c) => { const a = Math.abs(c); return Math.sign(c) * (a <= 0.0031308 ? a * 12.92 : 1.055 * a ** (1 / 2.4) - 0.055); };
const deg = (h) => ((h % 360) + 360) % 360;

const xyzToOklab = (xyz) => mul(LMS_LAB, mul(XYZ_LMS, xyz).map(Math.cbrt));
const oklabToXyz = (lab) => mul(LMS_XYZ, mul(LAB_LMS, lab).map((v) => v ** 3));
const srgbToXyz = (rgb) => mul(SRGB_XYZ, rgb.map(toLin));
const xyzToSrgb = (xyz) => mul(XYZ_SRGB, xyz).map(toGam);
const labToXyz = ([L, a, b]) => {
  const k = 24389 / 27, e = 216 / 24389;
  const fy = (L + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200;
  const f = (t) => (t ** 3 > e ? t ** 3 : (116 * t - 16) / k);
  return mul(D50_D65, [f(fx) * D50[0], L > k * e ? fy ** 3 : L / k, f(fz) * D50[2]]);
};
const xyzToLab = (xyz) => {
  const k = 24389 / 27, e = 216 / 24389;
  const [x, y, z] = mul(D65_D50, xyz).map((v, i) => v / D50[i]);
  const f = (t) => (t > e ? Math.cbrt(t) : (k * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
};
const polar = ([L, a, b]) => [L, Math.hypot(a, b), deg((Math.atan2(b, a) * 180) / Math.PI)];
const rect = ([L, C, H]) => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];

function num(s, scale = 1, pctOf = 1) {
  s = s.trim();
  if (s === "none") return 0;
  if (s.endsWith("%")) return (parseFloat(s) / 100) * pctOf;
  if (s.endsWith("deg")) return parseFloat(s);
  if (s.endsWith("turn")) return parseFloat(s) * 360;
  if (s.endsWith("rad")) return (parseFloat(s) * 180) / Math.PI;
  const n = parseFloat(s);
  if (Number.isNaN(n)) throw new Error(`Not a number: ${s}`);
  return n * scale;
}

export function parse(input) {
  const s = String(input).trim().toLowerCase();
  const hex = s.match(/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const v = [0, 2, 4, 6].map((i) => parseInt(h.slice(i, i + 2) || "ff", 16) / 255);
    return { lab: xyzToOklab(srgbToXyz(v.slice(0, 3))), alpha: v[3] };
  }
  const fn = s.match(/^([a-z0-9-]+)\((.*)\)$/);
  if (!fn) throw new Error(`Not a CSS color: ${input}`);
  let [, name, body] = fn;
  let space = name;
  if (name === "color") {
    const parts = body.trim().split(/\s+/);
    space = parts.shift();
    body = parts.join(" ");
  }
  const [main, a] = body.split("/");
  const p = main.split(/[\s,]+/).filter(Boolean);
  if (p.length < 3) throw new Error(`Needs three channels: ${input}`);
  const alpha = a ? num(a, 1, 1) : p[3] ? num(p[3], 1, 1) : 1;
  const at = (i, scale, pctOf) => num(p[i], scale, pctOf);
  let lab;
  if (name === "rgb" || name === "rgba") lab = xyzToOklab(srgbToXyz([0, 1, 2].map((i) => at(i, 1 / 255, 1))));
  else if (name === "hsl" || name === "hsla") {
    const h = at(0, 1, 360), sat = at(1, 0.01, 1), l = at(2, 0.01, 1);
    const f = (n) => { const k = (n + h / 30) % 12; return l - sat * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    lab = xyzToOklab(srgbToXyz([f(0), f(8), f(4)]));
  } else if (name === "oklab") lab = [at(0, 1, 1), at(1, 1, 0.4), at(2, 1, 0.4)];
  else if (name === "oklch") lab = rect([at(0, 1, 1), at(1, 1, 0.4), at(2, 1, 360)]);
  else if (name === "lab") lab = xyzToOklab(labToXyz([at(0, 1, 100), at(1, 1, 125), at(2, 1, 125)]));
  else if (name === "lch") lab = xyzToOklab(labToXyz(rect([at(0, 1, 100), at(1, 1, 150), at(2, 1, 360)])));
  else if (space === "srgb") lab = xyzToOklab(srgbToXyz([0, 1, 2].map((i) => at(i, 1, 1))));
  else if (space === "display-p3") lab = xyzToOklab(mul(P3_XYZ, [0, 1, 2].map((i) => toLin(at(i, 1, 1)))));
  else throw new Error(`Unknown color space: ${space}`);
  return { lab, alpha };
}

export const oklch = (c) => polar(c.lab);
export const fromOklch = (L, C, H, alpha = 1) => ({ lab: rect([L, C, H]), alpha });
const rawSrgb = (c) => xyzToSrgb(oklabToXyz(c.lab));
const inGamut = (rgb) => rgb.every((v) => v >= -0.0001 && v <= 1.0001);

export function srgb(c) {
  let rgb = rawSrgb(c);
  if (inGamut(rgb)) return rgb.map((v) => Math.min(1, Math.max(0, v)));
  const [L, C, H] = oklch(c);
  let lo = 0, hi = C;
  while (hi - lo > 0.0001) {
    const mid = (lo + hi) / 2;
    if (inGamut(rawSrgb(fromOklch(L, mid, H)))) lo = mid; else hi = mid;
  }
  return rawSrgb(fromOklch(L, lo, H)).map((v) => Math.min(1, Math.max(0, v)));
}

const r = (n, d = 4) => +n.toFixed(d);
const pct = (n) => `${r(n * 100, 2)}%`;
const tail = (c) => (c.alpha < 1 ? ` / ${r(c.alpha, 3)}` : "");

export const FORMATS = ["hex", "rgb", "srgb", "hsl", "oklch", "oklab", "lab", "lch", "p3"];

export function format(c, fmt = "oklch") {
  const rgb = srgb(c);
  if (fmt === "hex") {
    const h = [...rgb, ...(c.alpha < 1 ? [c.alpha] : [])].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
    return `#${h}`;
  }
  if (fmt === "rgb") return `rgb(${rgb.map((v) => Math.round(v * 255)).join(" ")}${tail(c)})`;
  if (fmt === "srgb") return `color(srgb ${rgb.map((v) => r(v)).join(" ")}${tail(c)})`;
  if (fmt === "hsl") {
    const [R, G, B] = rgb, max = Math.max(R, G, B), min = Math.min(R, G, B), l = (max + min) / 2, d = max - min;
    const s = d < 1e-6 ? 0 : d / (1 - Math.abs(2 * l - 1));
    const h = d < 1e-6 ? 0 : max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
    return `hsl(${r(deg(h * 60), 1) % 360} ${pct(s)} ${pct(l)}${tail(c)})`;
  }
  if (fmt === "oklch") { const [L, C, H] = oklch(c); return `oklch(${r(L)} ${r(C)} ${C < 0.0005 ? 0 : r(H, 2)}${tail(c)})`; }
  if (fmt === "oklab") return `oklab(${c.lab.map((v) => r(v)).join(" ")}${tail(c)})`;
  const lab = xyzToLab(oklabToXyz(c.lab));
  if (fmt === "lab") return `lab(${lab.map((v) => r(v, 2)).join(" ")}${tail(c)})`;
  if (fmt === "lch") { const [L, C, H] = polar(lab); return `lch(${r(L, 2)} ${r(C, 2)} ${C < 0.05 ? 0 : r(H, 2)}${tail(c)})`; }
  if (fmt === "p3") return `color(display-p3 ${mul(XYZ_P3, oklabToXyz(c.lab)).map((v) => r(Math.min(1, Math.max(0, toGam(v))))).join(" ")}${tail(c)})`;
  throw new Error(`Unknown format: ${fmt}. Use one of ${FORMATS.join(", ")}`);
}

export const every = (c) => Object.fromEntries(FORMATS.map((f) => [f, format(c, f)]));

const luminance = (c) => { const [R, G, B] = srgb(c).map(toLin); return 0.2126 * R + 0.7152 * G + 0.0722 * B; };

export function wcag(text, bg) {
  const a = luminance(text), b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function apca(text, bg) {
  const Y = (c) => { const [R, G, B] = srgb(c); return 0.2126729 * R ** 2.4 + 0.7151522 * G ** 2.4 + 0.072175 * B ** 2.4; };
  const clamp = (y) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414);
  const t = clamp(Y(text)), b = clamp(Y(bg));
  if (Math.abs(b - t) < 0.0005) return 0;
  if (b > t) { const s = (b ** 0.56 - t ** 0.57) * 1.14; return s < 0.1 ? 0 : (s - 0.027) * 100; }
  const s = (b ** 0.65 - t ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

export const GOAL = { wcag: 4.5, apca: 60 };
export const passes = (text, bg, goal = GOAL) => wcag(text, bg) >= goal.wcag && Math.abs(apca(text, bg)) >= goal.apca;

export function fix(text, bg, goal = GOAL) {
  if (passes(text, bg, goal)) return text;
  const [L, C, H] = oklch(text), bgL = oklch(bg)[0];
  const dirs = bgL > 0.6 ? [-1, 1] : [1, -1];
  for (const dir of dirs) {
    for (let l = L; l >= 0 && l <= 1; l += dir * 0.005) {
      const c = fromOklch(l, C, H, text.alpha);
      if (passes(c, bg, goal)) return c;
    }
  }
  return fromOklch(bgL > 0.6 ? 0 : 1, 0, 0);
}

export function measure(text, bg, goal = GOAL) {
  return { wcag: r(wcag(text, bg), 2), apca: r(apca(text, bg), 1), pass: passes(text, bg, goal) };
}
