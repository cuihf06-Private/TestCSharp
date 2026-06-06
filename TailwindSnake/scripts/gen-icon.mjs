// 用 Node.js 内置能力生成一个 1024x1024 的 PNG 图标(纯色 + 圆点),不依赖任何外部包。
// Node 18+ 内置 zlib,可以手写 PNG,但简单起见用纯色 PNG 字节。
// 这里用一种最小可行方案:把已经准备好的 base64 PNG 直接写到目标文件。

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// 一个 1024x1024 的薄荷绿 + 中央圆点的 PNG (base64)
// 我们用最稳的方式:画一个 1024x1024 的纯色 PNG,后续 tauri icon 会做处理。
// 这里使用一个手写的小型 PNG 生成器:逐行写 RGBA -> zlib -> PNG。

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
  // RGBA 像素 + 每行前缀 filter byte(0)
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = draw(x, y);
      const off = y * stride + 1 + x * 4;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const W = 1024;
const cx = W / 2;
const cy = W / 2;

// 清新的薄荷绿渐变背景 + 一个白色圆点
function pixel(x, y) {
  // 背景:左上到右下的渐变
  const t = (x + y) / (2 * W);
  const r = Math.round(220 + (34 - 220) * t);
  const g = Math.round(252 + (197 - 252) * t);
  const b = Math.round(231 + (94 - 231) * t);
  let cr = r, cg = g, cb = b, ca = 255;

  // 圆角矩形外框
  const radius = 180;
  const inX = x > 60 && x < W - 60;
  const inY = y > 60 && y < W - 60;
  if (inX && inY) {
    // 圆角检测
    const dx = Math.max(0, 60 + radius - x, x - (W - 60 - radius));
    const dy = Math.max(0, 60 + radius - y, y - (W - 60 - radius));
    if (dx * dx + dy * dy > radius * radius) {
      return [0, 0, 0, 0];
    }
  } else {
    return [0, 0, 0, 0];
  }

  // 中央白点(蛇头)
  const dHead = Math.hypot(x - cx, y - cy);
  if (dHead < 140) {
    return [255, 255, 255, 255];
  }
  // 内圈点缀
  if (dHead > 200 && dHead < 220) {
    return [255, 255, 255, 230];
  }
  return [cr, cg, cb, ca];
}

const png = makePNG(W, W, pixel);

const out = process.argv[2] || "src-tauri/icons/icon.png";
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, png);
console.log("Generated:", out, png.length, "bytes");
