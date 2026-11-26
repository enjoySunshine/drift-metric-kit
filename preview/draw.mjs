import fs from "node:fs";
import { openSync } from "../dist/node/index.js";

const file = new URL("../test/data/Mada/Mada-VF.ttf", import.meta.url);

// Lay out one line. The drawing only places what the layout hands back:
// each glyph's origin comes from the positions, and each glyph's ink start
// is read from the run, not recomputed here.
function measure(font, text) {
  const run = font.layout(text);
  let pen = 0;
  const glyphs = run.glyphs.map((glyph, i) => {
    const position = run.positions[i];
    const origin = pen + position.xOffset;
    pen += position.xAdvance;
    return { d: glyph.path.toSVG(), origin };
  });
  return { run, glyphs, width: pen };
}

function num(value) {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

const base = openSync(file);
const heavy = openSync(file).getVariation({ wght: 900 });

// Weight 900 is laid out first, on purpose: the default line must still
// come back with its own positions.
const heavyLine = measure(heavy, "To");
const baseLine = measure(base, "To");

const rows = [
  { label: "默认字重", line: baseLine, top: 80 },
  { label: "字重 900", line: heavyLine, top: 860 },
];

const parts = [];
for (const row of rows) {
  const { run, glyphs, width } = row.line;
  const ink = run.inkStarts[1];
  const origin = glyphs[1].origin;
  parts.push(`<g transform="translate(48 ${row.top + 700}) scale(1 -1)">`);
  parts.push(
    `<line x1="0" y1="0" x2="${width}" y2="0" stroke="#5c5346" stroke-width="2"/>`,
  );
  for (const glyph of glyphs) {
    parts.push(
      `<path d="${glyph.d}" transform="translate(${glyph.origin} 0)" fill="#f4f1ea"/>`,
    );
  }
  parts.push(
    `<line x1="${ink}" y1="-40" x2="${ink}" y2="680" stroke="#d85a30" stroke-width="3"/>`,
  );
  parts.push(`</g>`);
  parts.push(
    `<text x="48" y="${row.top + 24}" fill="#f4f1ea" font-family="sans-serif" font-size="28">${row.label}  第二个字起笔 ${num(ink)}  笔位 ${num(origin)}  单独量前进 ${num(run.glyphs[0].advanceWidth)} / ${num(run.glyphs[1].advanceWidth)}  左缘 ${num(run.glyphs[1].bbox.minX)}</text>`,
  );
  console.log(
    row.label,
    JSON.stringify({
      inkStarts: run.inkStarts,
      xAdvance: run.positions.map((p) => p.xAdvance),
      advances: run.glyphs.map((g) => g.advanceWidth),
      minX: run.glyphs.map((g) => g.bbox.minX),
    }),
  );
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 1560" width="960" height="1170">
  <rect width="1280" height="1560" fill="#171410"/>
  ${parts.join("\n  ")}
</svg>
`;
fs.writeFileSync(new URL("./out.svg", import.meta.url), svg);
console.log("wrote preview/out.svg");
