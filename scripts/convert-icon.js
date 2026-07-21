const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT = process.argv[2] || path.join(__dirname, '..', 'public', 'icon.png');
const OUT = path.join(__dirname, '..', 'public');

async function main() {
  const img = sharp(INPUT);
  const meta = await img.metadata();
  console.log(`Source: ${meta.width}x${meta.height}, ${meta.format}`);

  const sizes = [256, 64, 48, 32, 16];
  const buffers = {};

  for (const s of sizes) {
    const buf = await img.clone().resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    buffers[s] = buf;
    if (s === 256) {
      fs.writeFileSync(path.join(OUT, 'icon.png'), buf);
      console.log(`  ✓ public/icon.png (${s}x${s})`);
    }
    fs.writeFileSync(path.join(OUT, `icon-${s}.png`), buf);
  }

  const png256 = buffers[256];
  const ico = makeICO(png256, 256);
  fs.writeFileSync(path.join(OUT, 'icon.ico'), ico);
  console.log('  ✓ public/icon.ico');

  console.log('Done');
}

function makeICO(pngData, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngData.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngData]);
}

main().catch(err => { console.error(err); process.exit(1); });
