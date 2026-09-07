import qrcode from './vendor/qrcode.mjs';

export const DEFAULT_APPEARANCE = Object.freeze({ foreground: '#163D35', background: '#FFFFFF', size: 512 });
export const MAX_BYTES = 2331;
const encoder = new TextEncoder();
qrcode.stringToBytes = (text) => Array.from(encoder.encode(text));

export function byteLength(text) {
  return encoder.encode(text).length;
}

export function validColor(value) {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
}

export function validateAppearance(appearance) {
  if (!validColor(appearance.foreground) || !validColor(appearance.background)) {
    throw new Error('请输入完整的六位颜色值，例如 #163D35。');
  }
  if (!Number.isInteger(appearance.size) || appearance.size < 256 || appearance.size > 2048) {
    throw new Error('输出尺寸需为 256–2048 之间的整数。');
  }
  return { foreground: appearance.foreground.toUpperCase(), background: appearance.background.toUpperCase(), size: appearance.size };
}

export function createQR(text) {
  if (!text.trim()) throw new Error('输入网址或文字，即可生成二维码。');
  if (byteLength(text) > MAX_BYTES) throw new Error('内容过长，请缩短至 2331 字节以内。');
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  return qr;
}

function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function scanWarning({ foreground, background }) {
  const dark = luminance(foreground);
  const light = luminance(background);
  if (dark >= light) return '建议使用深色二维码、浅色背景，更容易识别。';
  if ((light + 0.05) / (dark + 0.05) < 4.5) return '当前颜色对比偏低，建议加深前景色。';
  return '';
}

export function drawQR(canvas, qr, appearance, size = appearance.size) {
  const count = qr.getModuleCount();
  const scale = Math.floor(size / (count + 8));
  const offset = Math.floor((size - count * scale) / 2);
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('无法绘制二维码，请重新打开插件。');
  context.fillStyle = appearance.background;
  context.fillRect(0, 0, size, size);
  context.fillStyle = appearance.foreground;
  // 整数像素和至少四个模块的留白，避免导出图出现模糊边缘。
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) context.fillRect(offset + col * scale, offset + row * scale, scale, scale);
    }
  }
}

export function createSVG(qr, appearance) {
  const count = qr.getModuleCount();
  const paths = [];
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) paths.push(`M${col + 4},${row + 4}h1v1h-1z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${appearance.size}" height="${appearance.size}" viewBox="0 0 ${count + 8} ${count + 8}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${appearance.background}"/><path d="${paths.join('')}" fill="${appearance.foreground}"/></svg>`;
}
