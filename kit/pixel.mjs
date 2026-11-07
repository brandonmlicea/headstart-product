const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export const SCENES = {
  meadow: { sky: ["#0f4c9e", "#1a62bf", "#3384d8", "#7cbcec", "#bfe4f8"], cloud: ["#ffffff", "#e3f0fb", "#b8d6f0", "#8db8e2"], town: ["#9db8d8", "#b9cfe6", "#d7e4f1"], hills: ["#7fbf4a", "#5ea43c", "#3f8a3a", "#2f6e35"], dark: "#1f4d2c", path: ["#d9c08a", "#c4a46a"], trunk: ["#5b4330", "#3f2f22"], leaf: ["#8ccf55", "#5fae3f", "#3e8a37", "#28622c"], flowers: ["#f6d74a", "#ffffff", "#e0566a", "#7fb8f0"], horizon: 0.56, tree: true, buildings: true, bag: true, trail: true },
  sky: { sky: ["#174f9a", "#1d62b5", "#2f79cc", "#5d9fe0", "#97c9f1"], cloud: ["#ffffff", "#e6f2fc", "#bcd9f2", "#94bde5"], hills: ["#7fbf4a", "#5ea43c", "#3f8a3a", "#2f6e35"], dark: "#1f4d2c", trunk: ["#5b4330", "#3f2f22"], leaf: ["#8ccf55", "#5fae3f", "#3e8a37", "#28622c"], flowers: ["#f6d74a", "#ffffff"], horizon: 0.93, edges: true },
  field: { sky: ["#2a7ad2", "#4b9de6", "#7cc0f2", "#b4dcf7", "#d8eefb"], cloud: ["#ffffff", "#eef6fd", "#c9e1f5", "#a4c8ea"], hills: ["#9ccc55", "#79b545", "#5a9a3c", "#3f7d35"], dark: "#2c5e2c", flowers: ["#f4c430", "#ffffff", "#f4c430", "#8a63d2", "#f4c430"], horizon: 0.42, field: true },
  grass: { sky: ["#f5f5f2"], cloud: ["#ffffff"], hills: ["#b3dc77", "#9fd064", "#8cc255", "#79b349"], dark: "#5e9a3b", flowers: ["#ffffff", "#f6d74a", "#e9f6c9"], horizon: 0.04 },
  dawn: { sky: ["#f2a37a", "#f6bf8a", "#f9d9a4", "#fcebc6", "#fdf3dc"], cloud: ["#fff6ea", "#fbe0c8", "#f2c3a0", "#e2a585"], town: ["#c9a7a0", "#dcbdb3", "#ecd5c9"], hills: ["#9db866", "#7d9f52", "#5f8546", "#466a3c"], dark: "#33502f", path: ["#e6cf9e", "#cfb07a"], flowers: ["#ffffff", "#f6d74a"], horizon: 0.62, buildings: true, trail: true },
  noon: { sky: ["#0f6fd0", "#2a88e0", "#5aa9ec", "#94cdf5", "#c6e7fb"], cloud: ["#ffffff", "#e8f3fc", "#c0dcf3", "#9cc4e8"], hills: ["#86c24c", "#64a83e", "#478f3a", "#337334"], dark: "#22512d", trunk: ["#5b4330", "#3f2f22"], leaf: ["#8ccf55", "#5fae3f", "#3e8a37", "#28622c"], flowers: ["#f6d74a", "#ffffff", "#e0566a"], horizon: 0.6, tree: true, bag: true },
  dusk: { sky: ["#3b3f8f", "#6a4f9c", "#b4639a", "#e9897f", "#f7b98a"], cloud: ["#f8d3c0", "#e6a9a6", "#b98aa8", "#8b6f9e"], town: ["#5a4f7d", "#6f6290", "#8576a3"], hills: ["#5d7f5a", "#4a6a4c", "#38563f", "#284234"], dark: "#1c3027", path: ["#b9967a", "#9b7a63"], flowers: ["#f7d36b", "#f2f2f2"], horizon: 0.6, buildings: true, trail: true, lights: true },
  night: { sky: ["#0b1430", "#122047", "#1b2e5e", "#253d74", "#31508a"], cloud: ["#3d4f7d", "#33446d", "#2a3a60", "#223052"], town: ["#1c2747", "#24315a", "#2d3c6a"], hills: ["#2c4a3f", "#243f36", "#1c342d", "#142822"], dark: "#0e1d18", flowers: ["#d8e2ff"], horizon: 0.6, buildings: true, stars: true, moon: true, lights: true },
};

function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noise(rand, n) {
  const pts = Array.from({ length: n + 2 }, rand);
  return (x) => {
    const i = Math.floor(x), f = x - i, a = pts[i % pts.length], b = pts[(i + 1) % pts.length];
    return a + (b - a) * f * f * (3 - 2 * f);
  };
}

export function paint(canvas, { scene = "meadow", seed = 7, width = 320, height = 180, dissolve = "", flip = false, props = "care", accent = "#2f8f83" } = {}) {
  const S = SCENES[scene] ?? SCENES.meadow;
  const W = (canvas.width = width), H = (canvas.height = height);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const rand = rng(seed);
  const set = (x, y, c, a = 255) => {
    x = Math.round(flip ? W - 1 - x : x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const [r, g, b] = typeof c === "string" ? hex(c) : c;
    const i = (y * W + x) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
  };
  const u = Math.max(1, Math.round(W / 320));
  const blk = (x, y, c) => { for (let dy = 0; dy < u; dy++) for (let dx = 0; dx < u; dx++) set(x + dx, y + dy, c); };
  const dith = (x, y, t, colors) => {
    const v = Math.max(0, Math.min(0.9999, t)) * (colors.length - 1);
    const i = Math.floor(v);
    return colors[Math.min(colors.length - 1, i + (v - i > BAYER[(y & 3) * 4 + (x & 3)] ? 1 : 0))];
  };
  const hy = Math.round(H * S.horizon);

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, dith(x, y, y / Math.max(1, hy), S.sky));

  if (S.stars) for (let i = 0; i < (W * H * 0.004) / (u * u); i++) blk(rand() * W, rand() * hy * 0.8, rand() > 0.7 ? "#ffffff" : "#9fb3e6");
  if (S.moon) { const mx = W * 0.78, my = H * 0.18, r = H * 0.07; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) set(mx + x, my + y, (x + r * 0.4) ** 2 + (y - r * 0.2) ** 2 < r * r * 0.5 ? "#f6efd2" : "#e4dcb8"); }

  const cloudCount = scene === "grass" ? 0 : scene === "night" || scene === "sky" ? 2 : scene === "field" ? 4 : 6;
  for (let c = 0; c < cloudCount; c++) {
    const cx = scene === "sky" ? (c % 2 ? W * (0.08 + rand() * 0.12) : W * (0.8 + rand() * 0.12)) : rand() * W, cy = H * (0.1 + rand() * (S.horizon - 0.18)), cw = W * (0.12 + rand() * 0.2);
    const blobs = Array.from({ length: 9 + Math.floor(rand() * 7) }, () => {
      const dx = (rand() - 0.5) * 1.6;
      return { x: cx + dx * cw * 0.6, y: cy - rand() * cw * 0.2 * (1 - Math.abs(dx) * 0.5), r: cw * (0.08 + rand() * 0.14) * (1 - Math.abs(dx) * 0.35) };
    });
    const base = Math.round(cy + cw * 0.06), top = Math.min(...blobs.map((b) => b.y - b.r));
    const edge = noise(rand, 8);
    for (let y = Math.floor(top); y < base; y++)
      for (let x = Math.floor(cx - cw); x < cx + cw; x++) {
        let inside = false;
        for (const b of blobs) if ((x - b.x) ** 2 + (y - b.y) ** 2 <= b.r * b.r) { inside = true; break; }
        if (!inside) continue;
        const t = (y - top) / (base - top) + (edge(Math.abs(x - cx) / (6 * u)) - 0.5) * 0.35;
        set(x, y, dith(x, y, t * 1.05, S.cloud));
      }
  }

  if (S.buildings) {
    const Wc = W / u, Hc = H / u, hc = Math.round(hy / u);
    let x = Math.floor(Wc * 0.12);
    const clinic = Math.floor(Wc * (0.3 + rand() * 0.2));
    while (x < Wc * 0.78) {
      const bw = 3 + Math.floor(rand() * 6), bh = 3 + Math.floor(rand() * (Hc * 0.09));
      const tall = rand() > 0.88 ? Math.round(Hc * 0.12) : 0;
      const col = S.town[Math.floor(rand() * S.town.length)];
      for (let yy = hc - bh - tall; yy < hc; yy++) for (let xx = x; xx < x + bw; xx++) {
        const win = (xx - x) % 2 === 1 && (yy - (hc - bh - tall)) % 3 === 1 && yy < hc - 1;
        blk(xx * u, yy * u, win ? (S.lights && rand() > 0.4 ? "#ffd98a" : S.town[2]) : col);
      }
      if (tall) for (let yy = hc - bh - tall - 4; yy < hc - bh - tall; yy++) blk((x + Math.floor(bw / 2)) * u, yy * u, S.town[0]);
      if (props !== "plain" && Math.abs(x - clinic) < 6) {
        const top = hc - 9, left = x;
        for (let yy = top; yy < hc; yy++) for (let xx = left; xx < left + 9; xx++) blk(xx * u, yy * u, "#f4f1ea");
        if (props === "learning") {
          for (let yy = top - 7; yy < top; yy++) blk((left + 1) * u, yy * u, "#6b6b6b");
          for (let i = 0; i < 3; i++) for (let k = 0; k <= 2 - i; k++) { blk((left + 2 + k) * u, (top - 7 + i) * u, accent); blk((left + 2 + k) * u, (top - 3 - i) * u, accent); }
          for (let xx = left + 1; xx < left + 8; xx += 2) for (let yy = top + 2; yy < hc - 1; yy += 3) blk(xx * u, yy * u, "#a9c2dc");
        } else for (let i = -1; i <= 1; i++) { blk((left + 4 + i) * u, (top + 3) * u, "#d8433f"); blk((left + 4) * u, (top + 3 + i) * u, "#d8433f"); }
        x += 10;
      }
      x += bw + (rand() > 0.6 ? 1 : 0);
    }
  }

  const layers = S.hills.length;
  const tops = [];
  for (let l = 0; l < layers; l++) {
    const n = noise(rand, 12), amp = H * (0.05 + l * 0.015), base = hy + (H - hy) * (l / layers) * 0.85;
    const top = (x) => base - amp * n((x / W) * (4 + l * 2));
    tops.push(top);
    for (let x = 0; x < W; x++) {
      const t0 = Math.round(top(x));
      for (let y = t0; y < H; y++) {
        const shade = (y - t0) / (H - t0 + 1);
        const c = y - t0 < u ? S.hills[Math.max(0, l - 1)] : rand() < 0.015 / u ? S.dark : shade > 0.6 && l === layers - 1 && BAYER[(y & 3) * 4 + (x & 3)] < 0.3 ? S.dark : S.hills[l];
        set(x, y, c);
      }
    }
  }

  if (S.trail) {
    for (let y = hy + 2; y < H; y++) {
      const t = (y - hy) / (H - hy);
      const cx = W * (0.18 + 0.3 * Math.sin(t * 1.6)), half = 1 + t * W * 0.06;
      for (let x = cx - half; x < cx + half; x++) if (y >= tops[1](x)) set(x, y, dith(x, y, Math.abs(x - cx) / half, S.path));
    }
  }

  if (S.field || S.flowers) {
    const count = (S.field ? W * H * 0.02 : W * H * 0.006) / (u * u);
    for (let i = 0; i < count; i++) {
      const x = rand() * W, y = hy + (H - hy) * (0.15 + 0.85 * rand() ** 0.7);
      const big = S.field && rand() > 0.82, col = S.flowers[Math.floor(rand() * S.flowers.length)];
      if (big) {
        for (let k = 0; k < 8; k++) blk(x + Math.round(Math.cos(k * 0.785) * 2) * u, y + Math.round(Math.sin(k * 0.785) * 2) * u, "#f4c430");
        blk(x, y, "#6b3f1f"); blk(x + u, y, "#6b3f1f"); blk(x, y + u, "#4b2c16");
        for (let s = 3; s < 8; s++) blk(x, y + s * u, S.hills[2]);
      } else {
        blk(x, y, col); blk(x - u, y, col); blk(x + u, y, col); blk(x, y - u, col); blk(x, y + u, col);
        blk(x, y, "#e9b53a");
      }
    }
    for (let i = 0; i < (W * H * 0.01) / (u * u); i++) { const x = rand() * W, y = hy + 3 * u + rand() * (H - hy); blk(x, y, S.dark); blk(x, y - u, S.hills[1]); }
  }

  const tree = (tx, ty, size, side) => {
    const tw = Math.max(3, Math.round(size * 0.18));
    for (let y = ty - size * 0.6; y < ty; y++) for (let x = tx - tw / 2; x < tx + tw / 2; x++) set(x, y, x > tx + tw * 0.1 ? S.trunk[1] : S.trunk[0]);
    const blobs = Array.from({ length: 14 }, () => ({ x: tx + (rand() - 0.5) * size * 1.1 + side * size * 0.15, y: ty - size * 0.75 - rand() * size * 0.5, r: size * (0.18 + rand() * 0.16) }));
    const minY = Math.min(...blobs.map((b) => b.y - b.r)), maxY = Math.max(...blobs.map((b) => b.y + b.r));
    for (let y = Math.floor(minY); y < maxY; y++) for (let x = Math.floor(tx - size); x < tx + size; x++) {
      let inside = false;
      for (const b of blobs) if ((x - b.x) ** 2 + (y - b.y) ** 2 <= b.r * b.r) { inside = true; break; }
      if (!inside) continue;
      const t = ((y - minY) / (maxY - minY)) * 0.7 + ((x - (tx - size)) / (2 * size)) * 0.3;
      set(x, y, rand() < 0.06 / u ? S.leaf[3] : dith(x, y, t, S.leaf));
    }
  };
  if (S.tree) tree(W * 0.86, H * 0.84, H * 0.42, 1);
  if (S.edges) { tree(W * 0.02, H * 1.02, H * 0.42, -1); tree(W * 0.99, H * 0.98, H * 0.38, 1); }

  const [ar, ag, ab] = hex(accent);
  const shade = (k) => [ar * k, ag * k, ab * k].map((v) => Math.min(255, Math.round(v)));
  if (S.bag && props === "care") {
    const bx = Math.round(W * 0.6), by = Math.round(H * 0.8), bw = Math.round(W * 0.07), bh = Math.round(bw * 0.62);
    for (let y = by - 3 * u; y < by; y++) for (let x = bx + bw * 0.3; x < bx + bw * 0.7; x++) if (y < by - 2 * u || x < bx + bw * 0.3 + u || x >= bx + bw * 0.7 - u) set(x, y, shade(0.45));
    for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) set(x, y, y === by ? shade(1.15) : x > bx + bw * 0.8 ? shade(0.7) : shade(0.9));
    const cx = bx + Math.floor(bw / 2), cy = by + Math.floor(bh / 2);
    for (let i = -2; i <= 2; i++) { blk(cx + i * u, cy, "#f4f1ea"); blk(cx, cy + i * u, "#f4f1ea"); }
    for (let x = bx + 1; x < bx + bw + 3 * u; x++) for (let k = 0; k < u; k++) set(x, by + bh + k, "#24451f");
  }
  if (S.bag && props === "learning") {
    const bx = Math.round(W * 0.6), by = Math.round(H * 0.82), bw = Math.round(W * 0.07);
    const books = [shade(0.9), "#e9b53a", "#f4f1ea", shade(0.65)];
    const th = Math.max(4, Math.round(bw * 0.2));
    books.forEach((c, i) => {
      const y0 = by - i * th, x0 = bx + (i % 2 ? 2 : 0), w = bw - (i % 2) * 3;
      for (let y = y0; y < y0 + th; y++) for (let x = x0; x < x0 + w; x++) set(x, y, y === y0 + th - 1 ? shade(0.4) : x === x0 + w - 2 && c !== "#f4f1ea" ? "#f4f1ea" : c);
    });
    for (let x = bx + 1; x < bx + bw + 3; x++) set(x, by + th, "#24451f");
  }

  if (dissolve) {
    const band = Math.round(H * 0.07);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const fromBottom = dissolve.includes("bottom") ? (y - (H - band)) / band : -1;
      const fromTop = dissolve.includes("top") ? (band - y) / band : -1;
      const t = Math.max(fromBottom, fromTop);
      if (t > 0 && rand() < t ** 1.4) d[(y * W + x) * 4 + 3] = 0;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function paintAll(root = document) {
  for (const c of root.querySelectorAll("canvas[data-pixel]")) {
    const o = c.dataset;
    paint(c, { scene: o.pixel, seed: Number(o.seed ?? 7), width: Number(o.w ?? 320), height: Number(o.h ?? 180), dissolve: o.dissolve ?? "", flip: o.flip === "true", props: o.props ?? "care", accent: o.accent ?? "#2f8f83" });
  }
}
