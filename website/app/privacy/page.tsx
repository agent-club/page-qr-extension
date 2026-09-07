import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
export const metadata: Metadata = { title: '隐私政策', description: '了解页码 Page QR 如何在本地处理网址、二维码内容和外观偏好。' };
export default function Privacy() {
 return <main className="policy shell"><a className="plain-link" href="/"><ArrowLeft size={17} />返回官网</a><header><ShieldCheck size={38} /><p className="eyebrow">PAGE QR / PRIVACY</p><h1>隐私政策</h1><p>生效日期：2026 年 9 月 7 日 · 适用于页码 Page QR v1.0.1</p></header>
 <div className="policy-summary">你的网址和二维码内容在浏览器本地处理。插件不会将它们传给我们或任何远程二维码服务。</div>
 <section><h2>1. 插件的用途</h2><p>页码由 Agent Club 项目维护者维护，唯一用途是将当前网页网址或你主动输入的内容生成二维码，并提供颜色、尺寸调整与图片导出。</p></section>
 <section><h2>2. 在本地处理的信息</h2><ul><li><strong>当前网页网址：</strong>仅当你点击插件时，读取活动标签页的完整 HTTP／HTTPS 网址，用于生成二维码。</li><li><strong>主动输入的内容：</strong>你输入的网址、文字或其他内容只用于当前弹窗的二维码生成。</li><li><strong>外观偏好：</strong>前景色、背景色和输出尺寸保存在浏览器本机扩展存储中，方便下次使用。</li></ul><p>网址和二维码内容不会写入扩展的持久存储。关闭弹窗后，插件不保留这些内容；重新打开时会重新读取当前页面。用户主动下载的 PNG／SVG 文件包含对应二维码，由用户自行管理。</p></section>
 <section><h2>3. 权限与使用范围</h2><p><code>activeTab</code> 用于点击插件后读取当前网页网址。<code>storage</code> 仅用于保存外观偏好。插件不申请全站访问、浏览历史、通讯录或账号权限，不向页面注入脚本。</p></section>
 <section><h2>4. 传输、共享与有限使用</h2><p>插件不发送网络请求，不收集、出售或向第三方传输网址、二维码内容和浏览历史，不用于广告、用户画像或与二维码功能无关的用途。所有二维码代码随插件本地打包，不执行远程代码。</p><p>通过 Chrome API 获得的信息仅用于明确披露的二维码功能。页码对这些信息的使用遵循 Chrome 网上应用店用户数据政策及其有限使用要求。</p></section>
 <section><h2>5. 数据控制与删除</h2><p>你可以通过「重置外观」恢复默认设置；卸载插件会移除扩展保存的外观偏好。已下载的图片不会随卸载自动删除，需要你在下载文件夹中管理。插件没有账号，也没有服务端内容数据库。</p></section>
 <section><h2>6. 官网与外部链接</h2><p>官网不设置应用分析或广告追踪，也不接收插件生成的二维码内容。官网托管服务可能为网页交付与安全运行处理 IP 地址、请求时间等基础网络信息。访问 GitHub 或 Chrome 网上应用店时，适用相应平台的隐私政策。</p><p>如果你通过 GitHub 提交问题，相关内容将由 GitHub 处理，公开 Issue 会对外可见。请勿在反馈中填写密码、访问令牌或含敏感信息的网址。</p></section>
 <section><h2>7. 政策更新与联系</h2><p>如数据处理方式发生变化，我们会更新此政策的日期，并在变更生效前通过官网及版本说明披露。隐私问题可通过项目的 <a href="https://github.com/agent-club/page-qr-extension/issues">GitHub 反馈入口 <ExternalLink size={14} /></a> 联系维护者。</p></section>
 <footer><a className="plain-link" href="/">返回页码官网 <ArrowLeft size={17} /></a></footer></main>;
}
