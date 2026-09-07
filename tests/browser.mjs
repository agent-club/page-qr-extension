import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const root = path.resolve(process.env.PAGE_QR_EXTENSION || fileURLToPath(new URL('../', import.meta.url)));
const output = path.resolve(process.env.PAGE_QR_ARTIFACTS || path.join(root, '.test-artifacts'));
await mkdir(output, { recursive: true });
for (const name of ['page-qr-768.png', 'page-qr-768.svg']) await rm(path.join(output, name), { force: true });
const profile = await mkdtemp(path.join(output, 'profile-'));
const context = await chromium.launchPersistentContext(profile, {
  ...(process.env.PAGE_QR_BROWSER ? { executablePath: process.env.PAGE_QR_BROWSER } : { channel: 'chromium' }),
  headless: true,
  viewport: { width: 1280, height: 1000 },
  args: ['--window-size=1280,1000', '--enable-unsafe-extension-debugging', `--disable-extensions-except=${root}`, `--load-extension=${root}`]
});
const checks = [];
const pass = (name) => { checks.push(name); console.log(`PASS ${name}`); };
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const until = async (fn) => {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) { const value = await fn(); if (value) return value; await pause(25); }
  throw new Error('Timed out waiting for browser state');
};

try {
  const browser = context.browser();
  const cdp = await browser.newBrowserCDPSession();
  const { extensions } = await cdp.send('Extensions.getExtensions');
  const extension = extensions.find(item => item.path === root);
  assert.ok(extension?.enabled, 'Extension must load and be enabled');
  assert.equal(extension.version, '1.0.0');
  pass('Manifest V3 实际目录加载成功');
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: output, eventsEnabled: true });
  const downloads = [];
  cdp.on('Browser.downloadWillBegin', event => downloads.push(event));
  const completed = new Set();
  cdp.on('Browser.downloadProgress', event => { if (event.state === 'completed') completed.add(event.guid); });

  const page = context.pages()[0];
  const original = 'https://example.com/page-qr-test?value=hello%20world&n=2#details';
  await page.route('https://example.com/**', route => route.fulfill({ body: '<!doctype html><title>Page QR test</title><h1>Page QR test</h1>', contentType: 'text/html' }));
  await page.goto(original);
  let popup;
  const browserErrors = [];

  async function openAction() {
    if (popup) await cdp.send('Target.closeTarget', { targetId: popup.targetId });
    const { targetInfos: tabs } = await cdp.send('Target.getTargets', { filter: [{ type: 'tab', exclude: false }] });
    const tab = tabs.find(item => item.url === page.url());
    assert.ok(tab, 'Test tab must be available');
    await cdp.send('Extensions.triggerAction', { id: extension.id, targetId: tab.targetId });
    const target = await until(async () => {
      const { targetInfos } = await cdp.send('Target.getTargets');
      return targetInfos.find(item => item.url === `chrome-extension://${extension.id}/popup.html`);
    });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: false });
    const pending = new Map();
    let sequence = 0;
    const listener = event => {
      if (event.sessionId !== sessionId) return;
      const message = JSON.parse(event.message);
      if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.text);
      if (message.id && pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
      }
    };
    cdp.on('Target.receivedMessageFromTarget', listener);
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      cdp.send('Target.sendMessageToTarget', { sessionId, message: JSON.stringify({ id, method, params }) }).catch(reject);
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    popup = { targetId: target.targetId, send, evaluate };
    await send('Runtime.enable');
    await send('Page.enable');
    await until(() => evaluate('document.getElementById("controls")?.disabled === false'));
    return popup;
  }

  const value = (id) => popup.evaluate(`document.getElementById(${JSON.stringify(id)}).value`);
  const text = (id) => popup.evaluate(`document.getElementById(${JSON.stringify(id)}).textContent`);
  const click = (id) => popup.evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
  async function fill(id, input) {
    await popup.evaluate(`(() => { const field = document.getElementById(${JSON.stringify(id)}); field.value = ${JSON.stringify(input)}; field.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  }
  const validPreview = () => until(() => popup.evaluate('!document.getElementById("qr-preview").hidden && !document.getElementById("download-png").disabled'));
  const previewPixels = () => popup.evaluate(`(() => { const canvas = document.getElementById('qr-preview'); return { width: canvas.width, height: canvas.height, pixels: Array.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data) }; })()`);
  function decode(data) { return jsQR(new Uint8ClampedArray(data.pixels || data.data), data.width, data.height)?.data; }
  async function capture(name) {
    const { data } = await popup.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile(path.join(output, name), Buffer.from(data, 'base64'));
  }

  await openAction();
  assert.equal(await value('content'), original);
  await validPreview();
  assert.equal(decode(await previewPixels()), original);
  assert.equal(await text('source-label'), '当前网页');
  const dimensions = await popup.evaluate('({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewport:innerHeight})');
  await capture('popup-default.png');
  assert.equal(dimensions.width, 390);
  assert.ok(dimensions.height <= 600, `Popup too tall: ${JSON.stringify(dimensions)}`);
  pass('工具栏动作自动读取活动标签页，预览解码一致，弹窗尺寸不超过 Chrome 限制');

  await context.setOffline(true);
  const custom = '你好，页码！🦊\nhttps://example.com/custom?x=1&y=2';
  await fill('content', custom);
  await validPreview();
  assert.equal(decode(await previewPixels()), custom);
  await fill('foreground', '#123456');
  await fill('background-picker', '#f4f8ff');
  await fill('size', '768');
  await validPreview();
  assert.equal(await value('background'), '#F4F8FF');
  assert.equal(await text('size-label'), '768 × 768 px');
  assert.equal(decode(await previewPixels()), custom);
  await capture('popup-custom.png');
  pass('断网时中文内容、十六进制颜色、颜色选择器和自定义尺寸实时生效');

  async function download(format) {
    const count = downloads.length;
    await click(`download-${format}`);
    const event = await until(() => downloads[count]);
    await until(() => completed.has(event.guid));
    assert.equal(event.suggestedFilename, `page-qr-768.${format}`);
    return readFile(path.join(output, event.suggestedFilename));
  }
  const png = PNG.sync.read(await download('png'));
  assert.equal(png.width, 768);
  assert.equal(png.height, 768);
  assert.equal(decode(png), custom);
  assert.deepEqual(Array.from(png.data.subarray(0, 4)), [244, 248, 255, 255]);
  assert.ok(png.data.some((_, i) => i % 4 === 0 && png.data[i] === 18 && png.data[i+1] === 52 && png.data[i+2] === 86));
  pass('真实 PNG 下载完成，尺寸与配色正确，文件解码回读一致');
  const svg = (await download('svg')).toString('utf8');
  assert.match(svg, /width="768" height="768"/);
  const raster = await popup.evaluate(`(async () => {
    const image = new Image();
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(${JSON.stringify(svg)});
    await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return { width:canvas.width, height:canvas.height, pixels:Array.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data) };
  })()`);
  assert.equal(decode(raster), custom);
  pass('真实 SVG 下载完成，经浏览器栅格化后解码回读一致');

  await click('restore-url');
  assert.equal(await value('content'), original);
  assert.equal(decode(await previewPixels()), original);
  await fill('content', '不应被保存的临时测试内容');
  await validPreview();
  await until(async () => {
    const data = await popup.evaluate('chrome.storage.local.get(null)');
    return data.appearance?.size === 768;
  });
  const stored = await popup.evaluate('chrome.storage.local.get(null)');
  assert.deepEqual(stored, { appearance: { foreground: '#123456', background: '#F4F8FF', size: 768 } });
  await openAction();
  assert.equal(await value('content'), original);
  assert.equal(await value('size'), '768');
  assert.equal(await value('foreground'), '#123456');
  assert.equal(await value('background'), '#F4F8FF');
  pass('恢复当前网址与弹窗重开正常；真实存储仅有外观，没有 URL 或内容');

  for (const [input, message] of [['', '输入网址或文字'], [' \n ', '输入网址或文字'], ['a'.repeat(2332), '内容过长']]) {
    await fill('content', input);
    await until(async () => (await text('status')).includes(message));
    assert.ok(await popup.evaluate('document.getElementById("download-png").disabled && document.getElementById("download-svg").disabled && document.getElementById("qr-preview").hidden'));
  }
  await click('restore-url');
  await fill('foreground', '#zzzzzz');
  assert.match(await text('status'), /六位颜色/);
  assert.ok(await popup.evaluate('document.getElementById("download-png").disabled'));
  await fill('foreground', '#123456');
  await fill('size', '255');
  assert.match(await text('status'), /整数/);
  await fill('size', '512.5');
  assert.match(await text('status'), /整数/);
  await click('reset-style');
  await validPreview();
  assert.equal(await value('size'), '512');
  assert.equal(await value('foreground'), '#163D35');
  await fill('foreground', '#AAAAAA');
  assert.match(await text('status'), /对比偏低/);
  await fill('foreground', '#FFFFFF');
  await fill('background', '#000000');
  assert.match(await text('status'), /深色二维码/);
  await click('reset-style');
  pass('空白、超长、无效颜色、尺寸错误阻止旧图下载；重置和低对比度提示正常');

  await popup.evaluate('chrome.storage.local.set = async () => { throw new Error("test storage failure"); }');
  await fill('size', '1024');
  await until(async () => (await text('storage-notice')).includes('未能保存'));
  assert.equal(decode(await previewPixels()), original);
  pass('注入存储写入失败时显示提示，仍能生成二维码');

  await page.goto('chrome://version');
  await openAction();
  assert.equal(await value('content'), '');
  assert.ok(await popup.evaluate('document.getElementById("restore-url").disabled'));
  assert.match(await text('tab-notice'), /可手动输入/);
  await fill('content', '内部页面也可以手动生成');
  await validPreview();
  assert.equal(decode(await previewPixels()), '内部页面也可以手动生成');
  pass('真实 Chrome 内部页明确提示，手动输入仍可生成');

  await popup.evaluate('chrome.storage.local.set({appearance:{foreground:"broken",background:"#FFFFFF",size:1}})');
  await openAction();
  assert.equal(await value('size'), '512');
  assert.match(await text('storage-notice'), /设置无效/);
  await popup.send('Page.addScriptToEvaluateOnNewDocument', { source: 'chrome.storage.local.get = async () => { throw new Error("test read failure"); }; chrome.tabs.query = async () => { throw new Error("test tabs failure"); };' });
  await popup.send('Page.reload');
  await until(() => popup.evaluate('document.getElementById("storage-notice")?.textContent.includes("无法读取")'));
  assert.match(await text('tab-notice'), /可手动输入/);
  await fill('content', 'API 失败后仍可手动生成');
  await validPreview();
  assert.equal(decode(await previewPixels()), 'API 失败后仍可手动生成');
  pass('无效偏好回到默认值；注入读取偏好与标签页 API 失败后仍可手动使用');

  assert.deepEqual(browserErrors, []);
  pass('测试期间没有未捕获的脚本异常');
  const report = { date: new Date().toISOString(), browser: browser.version(), project: root, checks, count: checks.length, errors: browserErrors, popupDimensions: dimensions };
  await writeFile(path.join(output, 'browser-results.json'), JSON.stringify(report, null, 2));
  console.log(`Completed ${checks.length} browser checks in Chrome ${report.browser}`);
} finally {
  await context.close();
  await rm(profile, { recursive: true, force: true });
}
