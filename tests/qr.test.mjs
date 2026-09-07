import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import jsQR from 'jsqr';
import { DEFAULT_APPEARANCE, MAX_BYTES, byteLength, createQR, createSVG, validateAppearance, scanWarning } from '../qr.mjs';

function decodeMatrix(qr) {
  const count = qr.getModuleCount();
  const scale = 4;
  const side = (count + 8) * scale;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let y = 0; y < side; y += 1) {
    for (let x = 0; x < side; x += 1) {
      const row = Math.floor(y / scale) - 4;
      const col = Math.floor(x / scale) - 4;
      if (row >= 0 && col >= 0 && row < count && col < count && qr.isDark(row, col)) {
        pixels.fill(0, (y * side + x) * 4, (y * side + x) * 4 + 3);
      }
    }
  }
  return jsQR(pixels, side, side)?.data;
}

for (const [label, value] of [
  ['完整 URL', 'https://example.com/a?name=hello%20world&n=2#details'],
  ['中文与非 BMP 字符', '你好，世界！🦊🌏 café 日本語'],
  ['前后空格与换行', '  第一行\n第二行  '],
  ['最大字节容量', 'a'.repeat(MAX_BYTES)]
]) {
  test(`${label}可由独立解码器回读`, () => assert.equal(decodeMatrix(createQR(value)), value));
}

test('空内容和超长 UTF-8 内容有明确错误', () => {
  for (const value of ['', ' \n\t']) assert.throws(() => createQR(value), /输入网址或文字/);
  assert.equal(byteLength('中🦊'), 7);
  assert.throws(() => createQR('a'.repeat(MAX_BYTES + 1)), /内容过长/);
  assert.throws(() => createQR('中'.repeat(778)), /内容过长/);
});

test('外观只接受完整颜色和尺寸范围内的整数', () => {
  assert.deepEqual(validateAppearance({ foreground: '#abcdef', background: '#ffffff', size: 768 }), { foreground: '#ABCDEF', background: '#FFFFFF', size: 768 });
  for (const color of ['#fff', 'red', '#12zz99', '', '"/><script>']) {
    assert.throws(() => validateAppearance({ ...DEFAULT_APPEARANCE, foreground: color }), /六位颜色/);
  }
  for (const size of [0, 255, 2049, 512.5, NaN, Infinity]) {
    assert.throws(() => validateAppearance({ ...DEFAULT_APPEARANCE, size }), /整数/);
  }
  assert.equal(validateAppearance({ ...DEFAULT_APPEARANCE, size: 2048 }).size, 2048);
});

test('低对比度及反色有扫码提示', () => {
  assert.equal(scanWarning(DEFAULT_APPEARANCE), '');
  assert.match(scanWarning({ foreground: '#FFFFFF', background: '#000000' }), /深色二维码/);
  assert.match(scanWarning({ foreground: '#AAAAAA', background: '#FFFFFF' }), /对比偏低/);
});

test('SVG 包含尺寸、颜色和四模块留白，不含原始内容', () => {
  const text = '<script>alert("内容")</script>';
  const qr = createQR(text);
  const svg = createSVG(qr, DEFAULT_APPEARANCE);
  assert.match(svg, /width="512" height="512"/);
  assert.ok(svg.includes(`viewBox="0 0 ${qr.getModuleCount() + 8} ${qr.getModuleCount() + 8}"`));
  assert.match(svg, /M4,4h1v1h-1z/);
  assert.ok(!svg.includes(text));
});

test('Manifest 仅声明当前标签页和外观存储权限，资源均随包提供', () => {
  const root = new URL('../', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', root)));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['activeTab', 'storage']);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
  assert.match(manifest.content_security_policy.extension_pages, /connect-src 'none'/);
  for (const file of [manifest.action.default_popup, ...Object.values(manifest.icons), 'vendor/qrcode.mjs']) {
    assert.ok(readFileSync(new URL(file, root)).length > 0);
  }
});
