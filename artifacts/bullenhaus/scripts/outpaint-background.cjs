// Одноразовый скрипт: расширяет фон портала зеркальными размытыми
// продолжениями по бокам, чтобы object-fit: cover заполнял экран
// без обрезки центральной композиции.
const sharp = require('D:/Новая папка/Recovery/node_modules/sharp');
const SRC = 'D:/Новая папка/Bullenhaus-clean/artifacts/bullenhaus/public/bullenhaus-gateway.jpg';
const OUT = 'D:/Новая папка/Bullenhaus-clean/artifacts/bullenhaus/public/bullenhaus-gateway-wide.jpg';

(async () => {
  const meta = await sharp(SRC).metadata();
  const W = meta.width, H = meta.height;          // 1280 x 853
  const targetAspect = 2.1;
  const canvasW = Math.round(H * targetAspect);   // 2688 при H=853
  const side = Math.round((canvasW - W) / 2);     // ширина каждой вставки

  // зеркальные продолжения левого и правого края
  const leftStrip = await sharp(SRC)
    .extract({ left: 0, top: 0, width: side, height: H })
    .flop()
    .blur(5)
    .modulate({ brightness: 0.82, saturation: 0.9 })
    .toBuffer();
  const rightStrip = await sharp(SRC)
    .extract({ left: W - side, top: 0, width: side, height: H })
    .flop()
    .blur(5)
    .modulate({ brightness: 0.82, saturation: 0.9 })
    .toBuffer();

  await sharp({ create: { width: canvasW, height: H, channels: 3, background: '#090806' } })
    .composite([
      { input: leftStrip, left: 0, top: 0 },
      { input: rightStrip, left: W + side, top: 0 },
      { input: SRC, left: side, top: 0 },
    ])
    .jpeg({ quality: 82 })
    .toFile(OUT);

  const m = await sharp(OUT).metadata();
  console.log('wide bg:', m.width, 'x', m.height, 'aspect:', (m.width / m.height).toFixed(2));
})().catch(e => { console.error(e.message); process.exit(1); });
