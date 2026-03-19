// Generate a simple ICO file for DarkNite
// Creates a 256x256 BMP inside an ICO container

const fs = require('fs');
const path = require('path');

const SIZE = 256;

// Create a simple pixel buffer (BGRA format)
const pixels = Buffer.alloc(SIZE * SIZE * 4);

// Draw a dark background with a yellow "D"
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;

    // Rounded rectangle background
    const margin = 24;
    const radius = 48;
    const inRect = x >= margin && x < SIZE - margin && y >= margin && y < SIZE - margin;
    const dx = Math.max(margin + radius - x, 0, x - (SIZE - margin - radius));
    const dy = Math.max(margin + radius - y, 0, y - (SIZE - margin - radius));
    const inRounded = inRect || (dx * dx + dy * dy <= radius * radius);

    if (inRounded) {
      // Check if pixel is part of the "D" letter
      const cx = (x - SIZE / 2) / (SIZE / 2);
      const cy = (y - SIZE / 2) / (SIZE / 2);

      // "D" shape: left bar + right arc
      const isLeftBar = x >= 72 && x <= 100 && y >= 64 && y <= 192;
      const isTopBar = x >= 72 && x <= 140 && y >= 64 && y <= 88;
      const isBottomBar = x >= 72 && x <= 140 && y >= 168 && y <= 192;
      const arcCx = 120, arcCy = 128, arcR = 72, arcR2 = 48;
      const adx = x - arcCx, ady = y - arcCy;
      const dist = Math.sqrt(adx * adx + ady * ady);
      const isArc = dist <= arcR && dist >= arcR2 && x >= 112;

      if (isLeftBar || isTopBar || isBottomBar || isArc) {
        // Yellow letter - BGRA
        pixels[i] = 0x18;     // B
        pixels[i + 1] = 0xC5; // G
        pixels[i + 2] = 0xF5; // R
        pixels[i + 3] = 0xFF; // A
      } else {
        // Dark background - BGRA
        pixels[i] = 0x14;     // B
        pixels[i + 1] = 0x0D; // G
        pixels[i + 2] = 0x0D; // R
        pixels[i + 3] = 0xFF; // A
      }
    } else {
      // Transparent
      pixels[i] = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 0;
    }
  }
}

// Flip vertically (BMP is bottom-up)
const flipped = Buffer.alloc(pixels.length);
for (let y = 0; y < SIZE; y++) {
  const srcOff = y * SIZE * 4;
  const dstOff = (SIZE - 1 - y) * SIZE * 4;
  pixels.copy(flipped, dstOff, srcOff, srcOff + SIZE * 4);
}

// Build ICO file
// ICO header: 6 bytes
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);      // Reserved
header.writeUInt16LE(1, 2);      // ICO type
header.writeUInt16LE(1, 4);      // 1 image

// BMP Info Header (BITMAPINFOHEADER): 40 bytes
const bmpHeader = Buffer.alloc(40);
bmpHeader.writeUInt32LE(40, 0);          // Header size
bmpHeader.writeInt32LE(SIZE, 4);         // Width
bmpHeader.writeInt32LE(SIZE * 2, 8);     // Height (double for ICO - includes mask)
bmpHeader.writeUInt16LE(1, 12);          // Planes
bmpHeader.writeUInt16LE(32, 14);         // Bits per pixel
bmpHeader.writeUInt32LE(0, 16);          // Compression (none)
bmpHeader.writeUInt32LE(flipped.length, 20); // Image size
bmpHeader.writeInt32LE(0, 24);           // X ppm
bmpHeader.writeInt32LE(0, 28);           // Y ppm
bmpHeader.writeUInt32LE(0, 32);          // Colors used
bmpHeader.writeUInt32LE(0, 36);          // Important colors

// AND mask (1 bit per pixel, rows padded to 4 bytes)
const maskRowBytes = Math.ceil(SIZE / 8);
const maskRowPadded = Math.ceil(maskRowBytes / 4) * 4;
const mask = Buffer.alloc(maskRowPadded * SIZE, 0);

const imageData = Buffer.concat([bmpHeader, flipped, mask]);

// Directory entry: 16 bytes
const entry = Buffer.alloc(16);
entry.writeUInt8(0, 0);            // Width (0 = 256)
entry.writeUInt8(0, 1);            // Height (0 = 256)
entry.writeUInt8(0, 2);            // Color palette
entry.writeUInt8(0, 3);            // Reserved
entry.writeUInt16LE(1, 4);         // Color planes
entry.writeUInt16LE(32, 6);        // Bits per pixel
entry.writeUInt32LE(imageData.length, 8);  // Size
entry.writeUInt32LE(6 + 16, 12);   // Offset (header + entry)

const ico = Buffer.concat([header, entry, imageData]);

fs.writeFileSync(path.join(__dirname, 'src', 'icon.ico'), ico);
console.log('Icon generated: src/icon.ico (' + ico.length + ' bytes)');
