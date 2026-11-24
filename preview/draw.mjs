import fs from "node:fs";
import { openSync } from "../dist/node/index.js";

const file = new URL("../test/data/Mada/Mada-VF.ttf", import.meta.url);

function measure(font, text) {
  const run = font.layout(text);
  let pen = 0;
  const glyphs = [];
  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i];
    const position = run.positions[i];
    const origin = pen + position.xOffset;
    glyphs.push({
      d: glyph.path.toSVG(),
      origin,
      ink: origin + glyph.bbox.minX,
      minX: glyph.bbox.minX,
      advance: glyph.advanceWidth,
      xAdvance: position.xAdvance,
      xOffset: position.xOffset,
    });
    pen += position.xAdvance;
  }
  return { glyphs, width: pen };
}

function num(value) {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

const base = openSync(file);
const heavy = openSync(file).getVariation({ wght: 900 });
const rows = [
  { label: "默认字重", line: measure(base, "To"), top: 80 },
  { label: "字重 900", line: measure(heavy, "To"), top: 860 },
];

const parts = [];
for (const row of rows) {
  const second = row.line.glyphs[1];
  const first = row.line.glyphs[0];
  parts.push(`<g transform="translate(48 ${row.top + 700}) scale(1 -1)">`);
  parts.push(`<line x1="0" y1="0" x2="${row.line.width}" y2="0" stroke="#5c5346" stroke-width="2"/>`);
  for (const glyph of row.line.glyphs) {
    parts.push(`<path d="${glyph.d}" transform="translate(${glyph.origin} 0)" fill="#f4f1ea"/>`);
  }
  parts.push(
    `<line x1="${second.ink}" y1="-40" x2="${second.ink}" y2="680" stroke="#d85a30" stroke-width="3"/>`,
  );
  parts.push(`</g>`);
  parts.push(
    `<text x="48" y="${row.top + 24}" fill="#f4f1ea" font-family="sans-serif" font-size="28">${row.label}  第二个字起笔 ${num(second.ink)}  笔位 ${num(second.origin)}  单独量前进 ${num(first.advance)} / ${num(second.advance)}  左缘 ${num(second.minX)}</text>`,
  );
  console.log(
    row.label,
    JSON.stringify({
      origin: second.origin,
      ink: second.ink,
      firstAdvance: first.advance,
      secondAdvance: second.advance,
      secondMinX: second.minX,
      xAdvance: [first.xAdvance, second.xAdvance],
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
