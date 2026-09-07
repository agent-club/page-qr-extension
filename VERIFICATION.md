# 验证记录

日期：2026-09-07。

验证对象：本仓库的 `page-qr-extension` 插件目录。以下命令中的本机路径已替换为可配置变量，保留命令结构和参数。

## 环境

- macOS arm64；Node.js `v25.8.0`。
- Playwright `1.58.2`，Chrome for Testing `147.0.7727.15`。
- 独立解码器 `jsqr 1.4.0`；PNG 文件解析使用 `pngjs 7.0.0`。
- 核心测试在本任务的暂存副本运行；真实浏览器通过 `PAGE_QR_EXTENSION` 加载上述实际交付目录。交付前逐文件 SHA-256 比较暂存源码与目标目录，确保一致。

## 已执行的命令与结果

`PAGE_QR_EXTENSION` 表示实际插件目录，`PAGE_QR_TEST_SOURCE` 表示当时包含开发依赖的测试暂存副本。复验时可将两者都设为本仓库的绝对路径，并先安装开发依赖。

语法检查在实际交付目录执行，退出码 **0**：

```sh
npm --prefix "$PAGE_QR_EXTENSION" run check
```

核心测试命令（在当时的暂存副本执行），退出码 **0**，**9 通过、0 失败**：

```sh
cd "$PAGE_QR_TEST_SOURCE"
npm test
```

覆盖完整 URL、中文与非 BMP 字符、空格与换行、2331 字节最大容量的独立解码；空白与超长内容；颜色与尺寸边界；对比度提示；SVG 留白和内容隔离；Manifest 权限及本地资源完整性。

真实浏览器测试命令，退出码 **0**，**11 项检查全部通过**：

```sh
PAGE_QR_EXTENSION="/path/to/page-qr-extension" \
PAGE_QR_ARTIFACTS="/path/to/browser-results" \
PAGE_QR_BROWSER="/path/to/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" \
node "$PAGE_QR_TEST_SOURCE/tests/browser.mjs"
```

1. Manifest V3 从实际交付目录加载，插件处于启用状态。
2. 通过 Chrome `Extensions.triggerAction` 触发真实工具栏动作，打开扩展弹窗；自动获取完整活动标签页 URL，Canvas 预览解码相同；弹窗宽 390 px，高度不超过 600 px。
3. 断网时编辑中文和特殊字符、六位颜色、原生颜色选择器、768 px 自定义尺寸，预览更新且可解码。
4. 通过真实下载流程生成 PNG；读取本次下载文件，验证 768 × 768 像素、前景／背景色以及二维码回读内容。
5. 通过真实下载流程生成 SVG；浏览器栅格化后由独立解码器回读，内容相同。
6. 恢复当前网址、关闭并重新打开弹窗；真实 `chrome.storage.local` 仅含 `appearance` 的三项外观字段，没有保存内容或网址。
7. 空白、超长、无效颜色、非法尺寸隐藏旧预览并禁用下载；外观重置及低对比度／反色提示生效。
8. 注入存储写入失败，显示保存失败提示，二维码生成仍可用。
9. 打开真实 `chrome://version` 内部页，无法自动读取普通网页网址时给出提示，手动内容仍可生成并解码。
10. 无效存储偏好恢复默认值；注入存储读取与标签页查询失败，手动生成仍可用。
11. 测试期间没有观察到未捕获的脚本异常。

浏览器测试使用合成页面和内容，未读取已有 Chrome 用户配置、浏览记录或用户标签页。下载检查读取本轮新生成的文件。临时测试配置在测试结束时清理。

## 验证边界

- 已验证真实扩展加载、真实工具栏默认动作、真实 Chrome API、真实 Canvas 和下载流程；工具栏动作由官方调试协议触发，没有通过用户日常 Chrome 配置进行手工点击安装。
- 外观截图来自真实扩展弹窗；测试中的断网由浏览器离线模式模拟。存储与标签页 API 失败通过测试注入触发。
- 未进行实体手机摄像头扫码、打印测试或不同扫码软件兼容性测试。颜色对比、长内容、拍摄条件会影响实际扫码表现。
- 最低 Chrome 102 由 Manifest 声明；本次只实际验证 Chrome for Testing 147，不将结果扩大为全部历史浏览器版本兼容性证明。
- 该功能验收阶段未执行 Chrome Web Store 发布或审核；仓库托管不代表商店发布。

交付目录中的 `tests/` 和 `package-lock.json` 可用于复验。安装开发依赖后运行 `npm run check`、`npm test`；设置合适的 `PAGE_QR_BROWSER` 后运行 `npm run test:browser`。具体说明见 `README.md`。
