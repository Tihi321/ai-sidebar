import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crcIn = Buffer.concat([typeBytes, data]);
  const crcOut = Buffer.alloc(4); crcOut.writeUInt32BE(crc32(crcIn), 0);
  return Buffer.concat([len, typeBytes, data, crcOut]);
}

function isInsideRoundedRect(px, py, size, r) {
  if (px < 0 || px > size || py < 0 || py > size) return false;
  const cx = Math.max(r, Math.min(size - r, px));
  const cy = Math.max(r, Math.min(size - r, py));
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

function createIconPNG(size) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0; // RGBA

  const r = size * 0.22;
  const rowSize = size * 4;
  const raw = Buffer.alloc(size * (1 + rowSize));

  for (let y = 0; y < size; y++) {
    const rs = y * (1 + rowSize);
    raw[rs] = 0;
    for (let x = 0; x < size; x++) {
      const ps = rs + 1 + x * 4;
      // Gradient: top-left indigo (#6366f1) → bottom-right violet (#8b5cf6)
      const t = (x + y) / (2 * size);
      const red = Math.round(99 + t * (139 - 99));
      const green = Math.round(102 + t * (92 - 102));
      const blue = Math.round(241 + t * (246 - 241));
      const inside = isInsideRoundedRect(x + 0.5, y + 0.5, size, r);
      raw[ps]   = inside ? red   : 0;
      raw[ps+1] = inside ? green : 0;
      raw[ps+2] = inside ? blue  : 0;
      raw[ps+3] = inside ? 255   : 0;
    }
  }
  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',deflateSync(raw)), chunk('IEND',Buffer.alloc(0))]);
}

mkdirSync('src/assets/icons', { recursive: true });
for (const size of [16, 48, 128]) {
  writeFileSync(`src/assets/icons/icon${size}.png`, createIconPNG(size));
  console.log(`Created icon${size}.png (${size}x${size})`);
}
