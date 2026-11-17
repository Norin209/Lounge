// Rebuild browser icons from the existing store logo. The monogram is used
// without the small wordmark so the artwork stays legible in browser tabs.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

async function main() {
  const root = path.resolve(__dirname, '..');
  const cropped = await sharp(path.join(root, 'public/logo-black.png'))
    .extract({ left: 1300, top: 2400, width: 2000, height: 1050 })
    .png()
    .toBuffer();
  const monogram = await sharp(cropped)
    .trim()
    .resize(400, 400, { fit: 'inside' })
    .png()
    .toBuffer();
  const icon = await sharp({ create: { width: 512, height: 512, channels: 4, background: '#fbf7f0' } })
    .composite([{ input: monogram, gravity: 'centre' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(root, 'app/icon.png'), icon);
  await sharp(icon).resize(180, 180).png().toFile(path.join(root, 'app/apple-icon.png'));

  // An ICO directory can contain PNG images, giving browsers native sizes.
  const sizes = [16, 32, 48, 64];
  const images = await Promise.all(sizes.map(size => sharp(icon).resize(size, size).png().toBuffer()));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index];
    header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  });
  fs.writeFileSync(path.join(root, 'app/favicon.ico'), Buffer.concat([header, ...images]));
  console.log('Generated store monogram favicon, browser icon, and Apple touch icon.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
