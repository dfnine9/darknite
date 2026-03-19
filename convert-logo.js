const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + count * entrySize;
  let offset = dirSize;
  const entries = [];
  for (const buf of pngBuffers) {
    entries.push({ buf, offset });
    offset += buf.length;
  }
  const ico = Buffer.alloc(offset);
  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(count, 4);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const off = headerSize + i * entrySize;
    const s = sizes[i];
    ico.writeUInt8(s >= 256 ? 0 : s, off);
    ico.writeUInt8(s >= 256 ? 0 : s, off + 1);
    ico.writeUInt8(0, off + 2);
    ico.writeUInt8(0, off + 3);
    ico.writeUInt16LE(1, off + 4);
    ico.writeUInt16LE(32, off + 6);
    ico.writeUInt32LE(e.buf.length, off + 8);
    ico.writeUInt32LE(e.offset, off + 12);
    e.buf.copy(ico, e.offset);
  }
  return ico;
}

async function main() {
  const src = path.join('C:', 'Users', 'Danie', 'Downloads', 'The-Batman-Logo-PNG-Picture.png');
  console.log('Reading:', src);

  const meta = await sharp(src).metadata();
  console.log('Original size:', meta.width, 'x', meta.height);

  // Step 1: Make the bat YELLOW instead of black
  // Negate the image (black->white), then tint yellow
  const yellowBat = await sharp(src)
    .negate({ alpha: false })  // black becomes white
    .png()
    .toBuffer();

  console.log('Yellow bat created');

  const sizes = [256, 48, 32, 16];
  const pngs = [];

  for (const s of sizes) {
    // Dark rounded background
    const bg = `<svg width="${s}" height="${s}">
      <rect width="${s}" height="${s}" rx="${Math.round(s*0.18)}" ry="${Math.round(s*0.18)}" fill="#0d0d14"/>
    </svg>`;

    // Resize yellow bat to fit with padding
    const padding = Math.round(s * 0.15);
    const innerSize = s - padding * 2;

    const resizedBat = await sharp(yellowBat)
      .resize(innerSize, Math.round(innerSize * 0.55), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const batMeta = await sharp(resizedBat).metadata();

    const png = await sharp(Buffer.from(bg))
      .composite([{
        input: resizedBat,
        top: Math.round((s - batMeta.height) / 2),
        left: Math.round((s - batMeta.width) / 2)
      }])
      .png()
      .toBuffer();

    pngs.push(png);
  }

  fs.writeFileSync(path.join(__dirname, 'src', 'icon.png'), pngs[0]);
  console.log('PNG saved: src/icon.png');

  const ico = await buildIco(pngs, sizes);
  fs.writeFileSync(path.join(__dirname, 'src', 'icon.ico'), ico);
  console.log('ICO saved: src/icon.ico (' + ico.length + ' bytes)');
}

main().catch(console.error);
