const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SIZE = 256;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" ry="48" fill="#0d0d14"/>
  <g transform="translate(128, 138) scale(0.9)">
    <path d="
      M 0,-45
      C -5,-45 -8,-35 -8,-30
      C -8,-25 -5,-22 -3,-20
      L -3,-18
      C -5,-18 -8,-20 -10,-22
      C -15,-27 -18,-35 -20,-40
      C -22,-45 -28,-55 -35,-58
      C -42,-61 -52,-58 -60,-50
      C -68,-42 -72,-30 -70,-20
      C -68,-10 -62,-2 -55,4
      C -48,10 -38,14 -30,16
      C -22,18 -15,18 -12,20
      C -9,22 -8,26 -10,30
      C -12,34 -18,40 -28,48
      C -38,56 -55,62 -70,64
      C -85,66 -100,64 -110,58
      C -100,68 -85,78 -68,82
      C -51,86 -32,84 -18,76
      C -4,68 4,68 18,76
      C 32,84 51,86 68,82
      C 85,78 100,68 110,58
      C 100,64 85,66 70,64
      C 55,62 38,56 28,48
      C 18,40 12,34 10,30
      C 8,26 9,22 12,20
      C 15,18 22,18 30,16
      C 38,14 48,10 55,4
      C 62,-2 68,-10 70,-20
      C 72,-30 68,-42 60,-50
      C 52,-58 42,-61 35,-58
      C 28,-55 22,-45 20,-40
      C 18,-35 15,-27 10,-22
      C 8,-20 5,-18 3,-18
      L 3,-20
      C 5,-22 8,-25 8,-30
      C 8,-35 5,-45 0,-45 Z
    " fill="#f5c518"/>
  </g>
</svg>`;

async function buildIco(pngBuffers) {
  // Build ICO manually from PNG buffers
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + count * entrySize;

  let offset = dirSize;
  const entries = [];

  for (const buf of pngBuffers) {
    entries.push({ buf, offset, size: buf.length });
    offset += buf.length;
  }

  const ico = Buffer.alloc(offset);
  // Header
  ico.writeUInt16LE(0, 0);      // Reserved
  ico.writeUInt16LE(1, 2);      // ICO
  ico.writeUInt16LE(count, 4);  // Count

  const sizes = [256, 48, 32, 16];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const off = headerSize + i * entrySize;
    const s = sizes[i] || 256;
    ico.writeUInt8(s >= 256 ? 0 : s, off);       // Width
    ico.writeUInt8(s >= 256 ? 0 : s, off + 1);   // Height
    ico.writeUInt8(0, off + 2);                    // Palette
    ico.writeUInt8(0, off + 3);                    // Reserved
    ico.writeUInt16LE(1, off + 4);                 // Planes
    ico.writeUInt16LE(32, off + 6);                // BPP
    ico.writeUInt32LE(e.size, off + 8);            // Size
    ico.writeUInt32LE(e.offset, off + 12);         // Offset
    e.buf.copy(ico, e.offset);
  }

  return ico;
}

async function main() {
  const svgBuf = Buffer.from(svg);

  // Generate multiple sizes
  const png256 = await sharp(svgBuf).resize(256, 256).png().toBuffer();
  const png48 = await sharp(svgBuf).resize(48, 48).png().toBuffer();
  const png32 = await sharp(svgBuf).resize(32, 32).png().toBuffer();
  const png16 = await sharp(svgBuf).resize(16, 16).png().toBuffer();

  // Save PNG for reference
  fs.writeFileSync(path.join(__dirname, 'src', 'icon.png'), png256);
  console.log('PNG saved: src/icon.png');

  // Build ICO with multiple sizes
  const ico = await buildIco([png256, png48, png32, png16]);
  fs.writeFileSync(path.join(__dirname, 'src', 'icon.ico'), ico);
  console.log('ICO saved: src/icon.ico (' + ico.length + ' bytes)');
}

main().catch(console.error);
