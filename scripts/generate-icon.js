const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcVal = crc32(Buffer.concat([t, data]));
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crcVal);
  return Buffer.concat([len, t, data, crc]);
}

function createPNG(w, h, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  ihdr[9] = 6;  ihdr[10] = 0;  ihdr[11] = 0;  ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const off = y * (1 + w * 4);
    raw[off] = 0;
    for (let x = 0; x < w; x++) {
      const pi = (y * w + x) * 4;
      const po = off + 1 + x * 4;
      raw[po] = pixels[pi];
      raw[po + 1] = pixels[pi + 1];
      raw[po + 2] = pixels[pi + 2];
      raw[po + 3] = pixels[pi + 3];
    }
  }
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

function makeICO(pngData, imageSize) {
  const count = 1;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(imageSize >= 256 ? 0 : imageSize, 0);
  entry.writeUInt8(imageSize >= 256 ? 0 : imageSize, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngData.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngData]);
}

function makePixel(x, y, w, h) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 8;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const taper = 1 - (dist / r);
  const blue = Math.round(79 + taper * 10);
  const purple = Math.round(140 + taper * 20);
  const fade = Math.max(0, Math.min(255, (1 - (dist - r + 4) / 4) * 255));
  if (dist > r) return [blue, 140 + Math.round(taper * 60), 255, dist > r + 4 ? 0 : fade];
  const grad = dist / r;
  const blend = grad < 0.7 ? 0 : (grad - 0.7) / 0.3;
  const rr = Math.round(79 * (1 - blend) + 99 * blend);
  const gg = Math.round(140 * (1 - blend) + 102 * blend);
  const bb = Math.round(255 * (1 - blend) + 241 * blend);
  const sw = w / 5;
  const fw = sw * 0.4;
  const fh = h * 0.5;
  const fx = w / 2 - fw / 2;
  const fy = h / 2 - fh / 2;
  const isInF = (px, py) => {
    const leftBar = px >= fx && px < fx + fw && py >= fy && py < fy + fh;
    const topBar = px >= fx && px < fx + fw * 2.5 && py >= fy + fh * 0.2 && py < fy + fh * 0.4;
    const midBar = px >= fx && px < fx + fw * 2 && py >= fy + fh * 0.5 && py < fy + fh * 0.6;
    return leftBar || topBar || midBar;
  };
  if (isInF(x, y)) {
    const fadeEdge = Math.min(
      Math.min(x - fx + 1, fx + fw - x + 1, y - fy + 1, fy + fh - y + 1) / 2, 1
    );
    const white = Math.round(200 + 55 * fadeEdge);
    return [white, white, white, Math.round(fadeEdge * 255 * (dist < r ? 1 : 0))];
  }
  const edgeFade = dist < r ? 255 : 0;
  return [rr, gg, bb, edgeFade];
}

function generateIcon(size) {
  const pixels = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = makePixel(x, y, size, size);
      pixels.push(p[0], p[1], p[2], p[3]);
    }
  }
  return createPNG(size, size, pixels);
}

const sizes = [256, 64, 48, 32, 16];
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const png256 = generateIcon(256);
fs.writeFileSync(path.join(publicDir, 'icon.png'), png256);
console.log('✓ Created public/icon.png (256x256)');

fs.writeFileSync(path.join(publicDir, 'icon.ico'), makeICO(png256, 256));
console.log('✓ Created public/icon.ico');

for (const s of sizes) {
  if (s === 256) continue;
  const png = generateIcon(s);
  fs.writeFileSync(path.join(publicDir, `icon-${s}.png`), png);
}
console.log('✓ Created additional icon sizes (64, 48, 32, 16)');
console.log('Done');
