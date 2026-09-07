import { DEFAULT_APPEARANCE, MAX_BYTES, byteLength, validColor, validateAppearance, createQR, drawQR, createSVG, scanWarning } from './qr.mjs';

const element = (id) => document.getElementById(id);
const content = element('content');
const canvas = element('qr-preview');
const status = element('status');
const pngButton = element('download-png');
const svgButton = element('download-svg');
let currentUrl = '';
let rendered = null;
let cachedContent = null;
let cachedQR = null;
let contentTimer;
let saveChain = Promise.resolve();
let saveRevision = 0;

function setStatus(message, tone = '') {
  status.textContent = message;
  status.dataset.tone = tone;
}

function readAppearance() {
  const appearance = { foreground: element('foreground').value, background: element('background').value, size: Number(element('size').value) };
  for (const name of ['foreground', 'background']) {
    element(name).setAttribute('aria-invalid', String(!validColor(appearance[name])));
  }
  element('size').setAttribute('aria-invalid', String(!Number.isInteger(appearance.size) || appearance.size < 256 || appearance.size > 2048));
  return validateAppearance(appearance);
}

function applyAppearance(appearance) {
  for (const name of ['foreground', 'background']) {
    element(name).value = appearance[name];
    element(`${name}-picker`).value = appearance[name];
  }
  element('size').value = appearance.size;
}

function invalidate() {
  rendered = null;
  canvas.hidden = true;
  element('empty-preview').hidden = false;
  pngButton.disabled = true;
  svgButton.disabled = true;
}

function render() {
  clearTimeout(contentTimer);
  invalidate();
  const text = content.value;
  const length = byteLength(text);
  element('content-count').textContent = `${length} / ${MAX_BYTES} 字节`;
  element('source-label').textContent = currentUrl && text === currentUrl ? '当前网页' : '自定义内容';
  content.setAttribute('aria-invalid', String(length > MAX_BYTES));
  try {
    const appearance = readAppearance();
    element('size-label').textContent = `${appearance.size} × ${appearance.size} px`;
    if (cachedContent !== text) {
      cachedQR = createQR(text);
      cachedContent = text;
    }
    drawQR(canvas, cachedQR, appearance, 190);
    rendered = { qr: cachedQR, appearance };
    canvas.hidden = false;
    element('empty-preview').hidden = true;
    pngButton.disabled = false;
    svgButton.disabled = false;
    const warning = scanWarning(appearance);
    setStatus(warning || (length > 800 ? '内容较多，建议下载大图后扫码。' : '扫一扫，即刻打开或读取内容'), warning || length > 800 ? 'warning' : '');
  } catch (error) {
    element('empty-message').textContent = '预览将在内容有效后显示';
    setStatus(error instanceof Error ? error.message : '二维码生成失败，请缩短内容后重试。', text.trim() ? 'error' : '');
  }
}

function saveAppearance() {
  let appearance;
  try { appearance = readAppearance(); } catch { return; }
  const revision = ++saveRevision;
  // 按输入顺序写入，避免连续修改时较早的异步保存覆盖较新的外观。
  saveChain = saveChain.then(() => chrome.storage.local.set({ appearance })).then(() => {
    if (revision === saveRevision) element('storage-notice').textContent = '仅记住外观，不保存网址和内容';
  }).catch(() => {
    if (revision === saveRevision) element('storage-notice').textContent = '外观未能保存，本次仍可生成和下载';
  });
}

function appearanceChanged() {
  for (const name of ['foreground', 'background']) {
    if (validColor(element(name).value)) element(`${name}-picker`).value = element(name).value;
  }
  render();
  saveAppearance();
}

function download(format) {
  render();
  if (!rendered) return;
  try {
    let url;
    if (format === 'png') {
      const output = document.createElement('canvas');
      drawQR(output, rendered.qr, rendered.appearance);
      url = output.toDataURL('image/png');
    } else {
      url = URL.createObjectURL(new Blob([createSVG(rendered.qr, rendered.appearance)], { type: 'image/svg+xml;charset=utf-8' }));
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `page-qr-${rendered.appearance.size}.${format}`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    if (format === 'svg') setTimeout(() => URL.revokeObjectURL(url), 10000);
    setStatus(`已发起 ${format.toUpperCase()} 下载，请查看浏览器下载列表。`);
  } catch {
    setStatus('导出失败，请重新打开插件后重试。', 'error');
  }
}

async function initialize() {
  const [preferences, tabs] = await Promise.allSettled([
    chrome.storage.local.get('appearance'),
    chrome.tabs.query({ active: true, currentWindow: true })
  ]);
  let appearance = DEFAULT_APPEARANCE;
  if (preferences.status === 'fulfilled' && preferences.value.appearance !== undefined) {
    try { appearance = validateAppearance(preferences.value.appearance); }
    catch { element('storage-notice').textContent = '已恢复默认外观，保存的设置无效'; }
  } else if (preferences.status === 'rejected') {
    element('storage-notice').textContent = '无法读取外观偏好，本次使用默认设置';
  }
  applyAppearance(appearance);
  const url = tabs.status === 'fulfilled' ? tabs.value[0]?.url : '';
  // 浏览器内部页和本地文件无法在其他设备直接打开，仍允许用户手动输入内容。
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) currentUrl = url;
  else element('tab-notice').textContent = '此页面无法获取网页网址，可手动输入';
  content.value = currentUrl;
  element('restore-url').disabled = !currentUrl;
  element('controls').disabled = false;
  render();
}

content.addEventListener('input', () => {
  clearTimeout(contentTimer);
  invalidate();
  element('content-count').textContent = `${byteLength(content.value)} / ${MAX_BYTES} 字节`;
  element('empty-message').textContent = '正在更新预览…';
  setStatus('正在更新预览…');
  contentTimer = setTimeout(render, 120);
});
for (const name of ['foreground', 'background']) {
  element(name).addEventListener('input', appearanceChanged);
  element(`${name}-picker`).addEventListener('input', (event) => {
    element(name).value = event.target.value.toUpperCase();
    appearanceChanged();
  });
}
element('size').addEventListener('input', appearanceChanged);
element('restore-url').addEventListener('click', () => { content.value = currentUrl; render(); });
element('reset-style').addEventListener('click', () => { applyAppearance(DEFAULT_APPEARANCE); appearanceChanged(); });
pngButton.addEventListener('click', () => download('png'));
svgButton.addEventListener('click', () => download('svg'));
initialize();
