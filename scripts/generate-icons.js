import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const rootDir = process.cwd();
  const iconSvgPath = path.join(rootDir, 'public', 'icon.svg');
  const svgBuffer = fs.readFileSync(iconSvgPath);

  // Densities for Android
  const densities = [
    { dir: 'mipmap-mdpi', launcherSize: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', launcherSize: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', launcherSize: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', launcherSize: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', launcherSize: 192, fgSize: 432 },
  ];

  // 1. Prepare SVG for foreground only (wallet & card without dark squircle background)
  // Or render full icon scaled to 70% inside transparent canvas for foreground
  for (const d of densities) {
    const targetDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', d.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // A. Standard ic_launcher.png (Full squircle app icon)
    await sharp(svgBuffer)
      .resize(d.launcherSize, d.launcherSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // B. ic_launcher_round.png (Circular cropped app icon)
    const circleMask = Buffer.from(
      `<svg width="${d.launcherSize}" height="${d.launcherSize}"><circle cx="${d.launcherSize/2}" cy="${d.launcherSize/2}" r="${d.launcherSize/2}" fill="#ffffff"/></svg>`
    );
    await sharp(svgBuffer)
      .resize(d.launcherSize, d.launcherSize)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // C. ic_launcher_foreground.png (Adaptive icon foreground: 66% safe zone on transparent)
    const innerSize = Math.round(d.fgSize * 0.72);
    const innerIcon = await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: d.fgSize,
        height: d.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{
      input: innerIcon,
      top: Math.round((d.fgSize - innerSize) / 2),
      left: Math.round((d.fgSize - innerSize) / 2)
    }])
    .png()
    .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Generated icons for ${d.dir}`);
  }

  // Generate web apple-touch-icon.png (180x180) and icon.png (512x512)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(rootDir, 'public', 'apple-touch-icon.png'));

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(rootDir, 'public', 'icon.png'));

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
