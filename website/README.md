# 页码 Page QR 官网

公开官网：https://page-qr.iambinlin.chatgpt.site

包含首页、隐私政策、实际插件截图与 v1.0.1 安装包。商店未审核发布前不展示虚构的商店安装链接。

## 本地开发

要求 Node.js 22.13 或更新版本。

```sh
npm ci --ignore-scripts
npm run dev
npm run build
```

项目使用 Sites / Vinext。`.openai/hosting.json` 记录已创建的站点归属；不应重复创建站点或将凭据写入该文件。插件本体和商店发布流程位于同一 GitHub 仓库的根目录。

更新安装包时，先在插件根目录运行 `npm run package:store`，再将生成的 ZIP 与校验文件更新至官网 `public/downloads/`，同步页面版本与隐私政策说明。
