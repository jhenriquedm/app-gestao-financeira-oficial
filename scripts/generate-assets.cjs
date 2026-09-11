const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const svgPath = path.join(__dirname, '../public/wallet-icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Copy to icon.svg as well
  fs.copyFileSync(svgPath, path.join(__dirname, '../public/icon.svg'));

  console.log('Generating Web and PWA icons...');
  // 1. PWA & Web icons
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(__dirname, '../public/pwa-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(__dirname, '../public/pwa-512x512.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(__dirname, '../public/pwa-maskable-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(__dirname, '../public/wallet-splash.png'));

  // 2. Android Launcher Mipmaps
  const mipmapSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  };

  const resDir = path.join(__dirname, '../android/app/src/main/res');

  for (const [folder, size] of Object.entries(mipmapSizes)) {
    const targetDir = path.join(resDir, folder);
    if (fs.existsSync(targetDir)) {
      await sharp(svgBuffer).resize(size, size).png().toFile(path.join(targetDir, 'ic_launcher.png'));
      await sharp(svgBuffer).resize(size, size).png().toFile(path.join(targetDir, 'ic_launcher_round.png'));
      // Foreground with some padding for adaptive icon
      const pad = Math.round(size * 0.18);
      await sharp(svgBuffer)
        .resize(size - pad * 2, size - pad * 2)
        .extend({
          top: pad,
          bottom: pad,
          left: pad,
          right: pad,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
      console.log(`Generated ${folder} (${size}x${size})`);
    }
  }

  // 3. Android Splash Screens (Centered wallet on dark slate/emerald luxury background #0f172a)
  async function generateSplash(width, height, destFile) {
    const iconSize = Math.min(Math.round(Math.min(width, height) * 0.42), 380);
    const iconBuffer = await sharp(svgBuffer).resize(iconSize, iconSize).png().toBuffer();

    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
      }
    })
    .composite([
      {
        input: iconBuffer,
        gravity: 'centre'
      }
    ])
    .png()
    .toFile(destFile);
  }

  const splashConfigs = [
    { folder: 'drawable', w: 480, h: 800 },
    { folder: 'drawable-port-mdpi', w: 320, h: 480 },
    { folder: 'drawable-port-hdpi', w: 480, h: 800 },
    { folder: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { folder: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { folder: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { folder: 'drawable-land-mdpi', w: 480, h: 320 },
    { folder: 'drawable-land-hdpi', w: 800, h: 480 },
    { folder: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { folder: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { folder: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
  ];

  for (const item of splashConfigs) {
    const targetDir = path.join(resDir, item.folder);
    if (fs.existsSync(targetDir)) {
      await generateSplash(item.w, item.h, path.join(targetDir, 'splash.png'));
      console.log(`Generated splash for ${item.folder}`);
    }
  }

  console.log('All icons and splash screens generated successfully!');
}

run().catch(console.error);
