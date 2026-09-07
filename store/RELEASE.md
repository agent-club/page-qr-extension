# 发布流程

## 版本与检查

1. 更新 `manifest.json`、`package.json` 及锁文件根包版本；每次商店更新使用更高版本号。
2. 在 `CHANGELOG.md` 记录用户可见变化。涉及权限或数据处理变化时，同步官网、隐私政策与商店披露。
3. 执行 `npm ci --ignore-scripts`、`npm run check`、`npm test`、`npm run package:store`。
4. 涉及二维码、弹窗或导出逻辑时，使用 Chrome for Testing 运行 `npm run test:browser`；按 README 配置浏览器可执行文件。
5. 检查自动打包的 ZIP。仅允许清单内的运行文件进入安装包，测试、官网、文档、开发依赖和本机配置不会被打包。

GitHub Actions 会在推送和 Pull Request 时运行语法检查、核心测试和商店打包，并保留 ZIP 作为工作流产物。它不会自动提交商店审核。

## 第一次上架

1. 使用准备维护该插件的 Google 账号进入 Chrome 网上应用店开发者控制台。首次使用需完成开发者注册、邮箱验证及平台要求的付款／协议步骤，由账号持有人完成。
2. 创建新条目，上传 `dist/page-qr-extension-版本.zip`。
3. 填写 `store/LISTING.md` 中的简介、详细说明、类别、语言、网站、支持和隐私政策链接，上传素材。
4. 按实际行为填写单一用途、权限理由、远程代码和数据处理声明。
5. 核对分发地区、可见性与开发者身份信息；涉及经营者／非经营者等法律身份的选项应由账号持有人按真实身份决定。
6. 提交审核并记录条目 ID、版本、提交时间及审核状态。收到平台确认后才记为“已提交”。审核通过后，才展示正式 Chrome 商店安装链接。

## 后续更新与恢复

- 更新现有条目，不重新创建插件 ID。先验证更新包及旧版保存的外观设置兼容性，再提交较高版本。
- 如需撤回未通过的提交，使用控制台提供的取消功能，并保留原版本材料。
- 已发布版本存在问题时，以更高版本号提交修复或恢复此前可用行为；不要把低版本号的 ZIP 当作商店回滚方案。
- 每次发布保留 ZIP 的 SHA-256、Git 提交和变更记录，便于核对实际上传内容。

## 官方依据

- [开发者注册](https://developer.chrome.com/docs/webstore/register)
- [准备扩展](https://developer.chrome.com/docs/webstore/prepare)
- [商店条目信息](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [隐私字段与权限理由](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [图片要求](https://developer.chrome.com/docs/webstore/images)
- [用户数据与有限使用](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [2026 年政策更新](https://developer.chrome.com/blog/cws-policy-updates-2026?hl=en)

本流程是工程发布说明，不替代平台最终审核或账号持有人的真实身份声明。
