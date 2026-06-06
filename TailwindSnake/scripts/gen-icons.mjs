// 生成 Tauri 所需的多尺寸图标 PNG + Windows ICO(单层),不依赖任何 npm 包。
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import zlib from "node:zlib";
import { Buffer } from "node:buffer";

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function makePNG(width, height, draw) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = draw(x, y);
      const off = y * stride + 1 + x * 4;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = a;
    }
  }
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// 绘制函数:薄荷绿圆角矩形 + 中央白点
function drawIcon(W) {
  const cx = W / 2, cy = W / 2;
  const pad = Math.round(W * 0.06);
  const radius = Math.round(W * 0.18);
  return (x, y) => {
    const inX = x > pad && x < W - pad;
    const inY = y > pad && y < W - pad;
    if (!inX || !inY) {
      const dx = Math.max(0, pad + radius - x, x - (W - pad - radius));
      const dy = Math.max(0, pad + radius - y, y - (W - pad - radius));
      if (dx * dx + dy * dy > radius * radius) return [0, 0, 0, 0];
    }
    // 背景渐变
    const t = (x + y) / (2 * W);
    const r = Math.round(220 + (34 - 220) * t);
    const g = Math.round(252 + (197 - 252) * t);
    const b = Math.round(231 + (94 - 231) * t);
    // 中央圆点
    const dHead = Math.hypot(x - cx, y - cy);
    const headR = W * 0.14;
    if (dHead < headR) return [255, 255, 255, 255];
    if (dHead < headR + W * 0.012) return [255, 255, 255, 230];
    return [r, g, b, 255];
  };
}

// Windows ICO 容器(支持嵌入多张 PNG)
function makeICO(pngs) {
  // pngs: [{ size, buffer }]
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entrySize = 16;
  const entries = Buffer.alloc(entrySize * count);
  const datas = [];
  let offset = 6 + entrySize * count;
  pngs.forEach((p, i) => {
    const w = p.size >= 256 ? 0 : p.size;
    const h = p.size >= 256 ? 0 : p.size;
    entries.writeUInt8(w, i * entrySize);
    entries.writeUInt8(h, i * entrySize + 1);
    entries.writeUInt8(0, i * entrySize + 2);
    entries.writeUInt8(0, i * entrySize + 3);
    entries.writeUInt16LE(1, i * entrySize + 4);
    entries.writeUInt16LE(32, i * entrySize + 6);
    entries.writeUInt32LE(p.buffer.length, i * entrySize + 8);
    entries.writeUInt32LE(offset, i * entrySize + 12);
    datas.push(p.buffer);
    offset += p.buffer.length;
  });
  return Buffer.concat([header, entries, ...datas]);
}

const outDir = process.argv[2] || "src-tauri/icons";
mkdirSync(outDir, { recursive: true });

const sizes = [32, 64, 128, 256, 512];
const pngBuffers = {};
for (const s of sizes) {
  const buf = makePNG(s, s, drawIcon(s));
  pngBuffers[s] = buf;
  if (s === 32) writeFileSync(join(outDir, "32x32.png"), buf);
  if (s === 128) writeFileSync(join(outDir, "128x128.png"), buf);
  if (s === 256) {
    writeFileSync(join(outDir, "128x128@2x.png"), buf);
    writeFileSync(join(outDir, "icon.png"), buf);
  }
}

// macOS .icns 我们不手写(格式复杂),先只输出 png;用户运行 tauri icon 时会自动生成
// 简化做法:复制一张大 PNG 当 icns 占位(Windows 上不会用)
writeFileSync(join(outDir, "icon.icns"), pngBuffers[512]);

// Windows .ico(嵌入 32/64/128/256)
const ico = makeICO([
  { size: 32, buffer: pngBuffers[32] },
  { size: 64, buffer: pngBuffers[64] },
  { size: 128, buffer: pngBuffers[128] },
  { size: 256, buffer: pngBuffers[256] },
]);
writeFileSync(join(outDir, "icon.ico"), ico);

console.log("Icons generated in", outDir);
