// Generates public/favicon.png — a 32x32 pixel-art CRT with a green
// phosphor "G" and the red rack LED in the corner. Pure Node, no deps.
//   node scripts/gen-favicon.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const SIZE = 16; // designed at 16x16, scaled 2x to 32x32
const SCALE = 2;

const COLORS = {
  _: [0, 0, 0, 0], // transparent
  B: [58, 54, 50, 255], // plastic bezel
  s: [6, 12, 8, 255], // screen (dark row)
  t: [10, 22, 13, 255], // screen (scanline row)
  G: [63, 255, 90, 255], // phosphor green
  R: [255, 45, 45, 255], // the red LED
};

// build the 16x16 pixel map
const px = Array.from({ length: SIZE }, () => Array(SIZE).fill('_'));

// bezel with the screen inset
for (let y = 1; y <= 13; y++)
  for (let x = 1; x <= 14; x++) px[y][x] = 'B';
for (let y = 2; y <= 12; y++)
  for (let x = 2; x <= 13; x++) px[y][x] = y % 2 ? 't' : 's';

// the G glyph, 7x9, centered on the screen
const glyph = [
  '.GGGGG.',
  'GG...GG',
  'G......',
  'G......',
  'G..GGGG',
  'G....GG',
  'G.....G',
  'GG...GG',
  '.GGGGG.',
];
glyph.forEach((row, gy) => {
  [...row].forEach((c, gx) => {
    if (c === 'G') px[3 + gy][4 + gx] = 'G';
  });
});

// 3-short-3-long, day 40
px[12][12] = 'R';

// scale up and encode scanlines (filter byte 0 + RGBA per row)
const out = SIZE * SCALE;
const raw = Buffer.alloc(out * (1 + out * 4));
for (let y = 0; y < out; y++) {
  const rowStart = y * (1 + out * 4);
  raw[rowStart] = 0;
  for (let x = 0; x < out; x++) {
    const c = COLORS[px[(y / SCALE) | 0][(x / SCALE) | 0]];
    c.forEach((v, i) => (raw[rowStart + 1 + x * 4 + i] = v));
  }
}

// --- minimal PNG writer ---
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(out, 0); // width
ihdr.writeUInt32BE(out, 4); // height
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type: RGBA

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(new URL('../public', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/favicon.png', import.meta.url), png);
console.log(`wrote public/favicon.png (${out}x${out}, ${png.length} bytes)`);
