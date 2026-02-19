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

function createPNG(size, r, g, b) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4);
  ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const rowSize = size * 3;
  const raw = Buffer.alloc(size * (1 + rowSize));
  for (let y = 0; y < size; y++) {
    const rs = y * (1 + rowSize);
    raw[rs] = 0;
    for (let x = 0; x < size; x++) {
      const ps = rs + 1 + x * 3;
      raw[ps] = r; raw[ps+1] = g; raw[ps+2] = b;
    }
  }
  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',deflateSync(raw)), chunk('IEND',Buffer.alloc(0))]);
}

mkdirSync('src/assets/icons', { recursive: true });
for (const size of [16, 48, 128]) {
  writeFileSync(`src/assets/icons/icon${size}.png`, createPNG(size, 99, 102, 241));
  console.log(`Created icon${size}.png`);
}
