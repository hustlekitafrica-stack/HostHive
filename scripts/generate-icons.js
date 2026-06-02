const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');
const screenshotsDir = path.join(__dirname, '../public/screenshots');

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

// Brand colors: dark red background #7f1d1d, white "K" letter
const BG = { r: 127, g: 29, b: 29, alpha: 1 };
const SCREENSHOT_BG = { r: 15, g: 118, b: 110, alpha: 1 }; // teal #0f766e

async function solidPng(width, height, background, outPath) {
  await sharp({ create: { width, height, channels: 4, background } })
    .png()
    .toFile(outPath);
  console.log('Created:', path.relative(path.join(__dirname, '..'), outPath));
}

async function main() {
  const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

  for (const size of iconSizes) {
    await solidPng(size, size, BG, path.join(iconsDir, `icon-${size}x${size}.png`));
  }

  // Maskable icons (same colour, browsers add padding)
  await solidPng(192, 192, BG, path.join(iconsDir, 'icon-maskable-192x192.png'));
  await solidPng(512, 512, BG, path.join(iconsDir, 'icon-maskable-512x512.png'));

  // Shortcut icons
  await solidPng(96, 96, BG, path.join(iconsDir, 'shortcut-dashboard-96x96.png'));
  await solidPng(96, 96, BG, path.join(iconsDir, 'shortcut-bookings-96x96.png'));
  await solidPng(96, 96, BG, path.join(iconsDir, 'shortcut-payments-96x96.png'));

  // Screenshots (required by manifest)
  await solidPng(540, 720, SCREENSHOT_BG, path.join(screenshotsDir, 'screenshot-540x720.png'));
  await solidPng(1280, 720, SCREENSHOT_BG, path.join(screenshotsDir, 'screenshot-1280x720.png'));

  console.log('\nAll PWA icons generated successfully!');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
