# 页码 · Page QR

点一下 Chrome 工具栏图标，就能把当前网页变成二维码。中文界面，二维码生成库随扩展打包，无需构建即可加载。

项目仓库：[agent-club/page-qr-extension](https://github.com/agent-club/page-qr-extension)。下载源码 ZIP 并解压，或运行：

```sh
git clone https://github.com/agent-club/page-qr-extension.git
```

## 安装到 Chrome

1. 在 Chrome 地址栏打开 `chrome://extensions`。
2. 打开右上角的「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择下载或克隆后的 `page-qr-extension` 目录（其中包含 `manifest.json`）。

4. 点击工具栏的扩展程序拼图图标，将「页码 · Page QR」固定到工具栏。
5. 打开一个普通网页，点击「页码」图标，当前网址的二维码即会出现。

安装时无需执行 npm 命令。请保留此目录；Chrome 会从这里读取插件文件。代码更新后，在扩展管理页面点击插件卡片的「重新加载」。卸载时先在扩展管理页面移除插件，再按需要移除这个独立目录。

## 使用

- **自动生成**：打开弹窗就读取当前活动标签页的完整 HTTP／HTTPS 网址，包含查询参数和片段。
- **自定义内容**：直接编辑输入框，可使用网址、中文、多行文字和特殊字符；「恢复当前网址」回到打开弹窗时读取的网址。
- **配色**：选择前景色和背景色，或输入完整的六位十六进制颜色值，例如 `#163D35`。低对比度或反色会提示扫码风险，仍允许导出。
- **尺寸**：输入 256–2048 之间的任意整数，决定导出图的宽度和高度；预览区保持紧凑大小。
- **导出**：下载 PNG 位图或 SVG 矢量图。文件名为 `page-qr-尺寸.png` 或 `page-qr-尺寸.svg`，保存在浏览器配置的下载位置。
- **外观记忆**：重新打开弹窗时恢复颜色和尺寸；「重置外观」恢复默认值。

二维码使用 M 级纠错、UTF-8 编码，最大内容为 **2331 字节**。中文和特殊字符通常占多个字节，输入框下方会显示实际字节数。空白、过长内容、无效颜色和无效尺寸会暂停预览及下载。长内容建议使用更大的导出尺寸；手机扫码效果还会受屏幕、打印和扫码器影响。

Chrome 内部页、新标签页、本地文件等不会自动转换为网址二维码，弹窗会提示手动输入。插件不会将这些地址当作普通网页静默导出。

## 数据与权限

运行时只使用以下权限：

| 权限 | 用途 |
| --- | --- |
| `activeTab` | 用户点击插件时，读取当前活动标签页网址 |
| `storage` | 在本机保存 `appearance` 下的前景色、背景色与尺寸 |

没有主机权限、内容注入脚本或后台服务。插件不保存网址、二维码内容或浏览历史，不使用 Chrome 同步存储。二维码内容仅存在于弹窗内存；用户主动下载的图片会包含对应的二维码。

没有远程二维码服务、远程字体、分析上报或账号系统。内容安全策略设定 `connect-src 'none'`，运行时代码与二维码库均从本地加载。

API 用法已核对 Chrome 官方文档：[activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)、[action 弹窗](https://developer.chrome.com/docs/extensions/reference/api/action)、[tabs.query](https://developer.chrome.com/docs/extensions/reference/api/tabs)、[storage](https://developer.chrome.com/docs/extensions/reference/api/storage)、[内容安全策略](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)。Manifest 声明最低 Chrome 102；实际验证的浏览器版本和范围见 [验证报告](VERIFICATION.md)。

## 开发与验证

Node.js 20 或更新版本用于运行测试；插件使用时不需要 Node.js。

```sh
cd /path/to/page-qr-extension
npm ci --ignore-scripts
npm run check
npm test
```

浏览器测试使用独立的临时配置，不访问现有 Chrome 用户数据。需要支持 `Extensions.getExtensions` 和 `Extensions.triggerAction` 调试命令的新版 Chromium／Chrome for Testing；本项目已使用 Chrome for Testing 147 验证。

```sh
PAGE_QR_BROWSER="/absolute/path/to/Chrome for Testing" npm run test:browser
```

`PAGE_QR_BROWSER` 应指向浏览器可执行文件；macOS 的路径位于 `.app/Contents/MacOS/` 中。也可以通过 `npx playwright install chromium` 安装 Playwright 默认浏览器，但如果该版本缺少上述实验性调试命令，需要改用新版 Chrome for Testing。调试命令限制仅影响自动化测试，不影响手动加载插件。

测试产物默认写入 `.test-artifacts/`，浏览器临时配置在测试结束时清理。可用 `PAGE_QR_ARTIFACTS` 改变产物目录；`PAGE_QR_EXTENSION` 可指定要加载的实际插件目录。测试覆盖实际工具栏动作、Canvas 预览解码、PNG／SVG 下载回读、离线自定义、偏好保存和相关失败场景。

## 文件

```text
manifest.json         Manifest V3、权限和本地资源入口
popup.html            中文弹窗
popup.css             弹窗样式
popup.mjs             当前标签页、交互、外观保存、下载
qr.mjs                输入校验、UTF-8 二维码、Canvas/SVG 绘制
vendor/qrcode.mjs     qrcode-generator 2.0.4，MIT 许可
icons/                本地图标
tests/                核心解码测试和真实浏览器测试
VERIFICATION.md       本次验证的环境、命令、结果和限制
```

第三方二维码库来自 [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)，版本固定为 2.0.4。原始版权说明保留在源码内，MIT 许可文本见 `vendor/LICENSE.qrcode-generator.txt`。`jsqr`、`pngjs`、`playwright` 仅用于开发验证。
