// Generate compact website assets; retain the originals for the classic page.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');

const photos = {
  'home-hero': 'photo-1600334089648-b0d9d3028eb2',
  'treatment-fallback': 'photo-1544161515-4ab6ce6db874',
  'ritual': 'photo-1620916566398-39f1143ab7be',
  'treatments-hero': 'photo-1600334129128-685c5582fd35',
  'shop-hero': 'photo-1540555700478-4be289fbecef',
};

async function main() {
  const brand = path.join(root, 'public/brand');
  const images = path.join(root, 'public/images');
  fs.mkdirSync(brand, { recursive: true });
  fs.mkdirSync(images, { recursive: true });
  for (const [input, output] of [['logo-black.png', 'logo-dark.webp'], ['logo.png', 'logo-light.webp']]) {
    await sharp(path.join(root, 'public', input))
      .extract({ left: 1400, top: 2450, width: 1840, height: 1360 })
      .resize(368, 272)
      .webp({ quality: 90 })
      .toFile(path.join(brand, output));
    console.log(`${output}: ${fs.statSync(path.join(brand, output)).size} bytes`);
  }
  for (const [name, id] of Object.entries(photos)) {
    const response = await fetch(`https://images.unsplash.com/${id}?w=1400&q=85&auto=format&fit=crop`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    const output = path.join(images, `${name}.webp`);
    await sharp(data).rotate().resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 78 }).toFile(output);
    console.log(`${name}: ${fs.statSync(output).size} bytes`);
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
