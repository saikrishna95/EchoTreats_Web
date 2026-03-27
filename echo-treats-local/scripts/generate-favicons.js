const Jimp = require('jimp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');
(async () => {
  try {
    const input = path.resolve('src/assets/logo.png');
    const outDir = path.resolve('public');
    await fs.promises.mkdir(outDir, { recursive: true });
    const image = await Jimp.read(input);
    const sizes = [16, 32, 48, 180, 192, 512];
    const generated = [];
    for (const size of sizes) {
      const outPath = path.join(outDir, `favicon-${size}x${size}.png`);
      const clone = image.clone().contain(size, size, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE, Jimp.RESIZE_BICUBIC);
      await clone.resize(size, size).writeAsync(outPath);
      generated.push(outPath);
    }
    const icoPath = path.join(outDir, 'favicon.ico');
    const icoBuffer = await pngToIco([path.join(outDir, 'favicon-16x16.png'), path.join(outDir, 'favicon-32x32.png')]);
    await fs.promises.writeFile(icoPath, icoBuffer);
    console.log('Favicon files generated:');
    console.log(' -', icoPath);
    generated.forEach((p) => console.log(' -', p));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();