import { ArrowDown, ArrowRight, Check, ChevronRight, Download, ExternalLink, Code2, LockKeyhole, Palette, QrCode, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const repository = 'https://github.com/agent-club/page-qr-extension';

export default function Home() {
  return <>
    <a className="skip-link" href="#main">跳到主要内容</a>
    <header className="site-header shell">
      <a className="brand" href="/" aria-label="页码首页"><img src="/page-qr-icon.png" width="36" height="36" alt="" /><strong>页码<span>PAGE QR</span></strong></a>
      <nav aria-label="主导航"><a href="#features">功能</a><a href="#install">安装指南</a><a href="/privacy">隐私政策</a><a className="github-link" href={repository}><Code2 size={19} /><span>GitHub</span><ExternalLink size={13} /></a></nav>
    </header>
    <main id="main">
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" />为 Chrome 而做的小工具</p>
          <h1>这一页，<br />扫码就<span className="headline-accent">带走。</span></h1>
          <p className="hero-description">从电脑到手机，少一点复制粘贴。<br />点一下，把当前网页变成属于你的二维码。</p>
          <div className="hero-actions"><Button nativeButton={false} render={<a href="/downloads/page-qr-extension-1.0.1.zip" download />} className="cta-button"><Download size={19} />下载 Chrome 插件</Button><a className="plain-link" href="#install">如何安装 <ArrowRight size={17} /></a></div>
          <p className="availability">v1.0.1 · 本地安装版<span>Chrome 商店上架准备中</span></p>
          <div className="hero-facts"><span><Check size={15} />本地生成</span><span><Check size={15} />无需账号</span><span><Check size={15} />源码公开</span></div>
        </div>
        <div className="product-visual">
          <div className="visual-grid" aria-hidden="true" />
          <div className="visual-topline"><span><QrCode size={17} />让分享，刚刚好</span><span>01 / PAGE QR</span></div>
          <img className="popup-image" src="/popup-default.png" width="390" height="594" alt="页码插件界面：打开后自动生成当前网址二维码，并提供内容、前景色、背景色、输出尺寸和下载选项。" />
          <div className="visual-caption"><span className="caption-dot" />你的网址，只留在你的设备里<LockKeyhole size={15} /></div>
        </div>
      </section>
      <section className="features shell" id="features" aria-labelledby="features-title">
        <div className="section-heading"><p className="eyebrow">小而专注</p><h2 id="features-title">分享网页，三件事就够了。</h2></div>
        <div className="feature-grid">
          <article><span className="feature-icon"><QrCode /></span><span className="feature-number">01</span><h3>点开，就有码</h3><p>自动读取当前网页的完整网址。也可以改成文字、链接或多行内容，预览随输入更新。</p></article>
          <article><span className="feature-icon"><Palette /></span><span className="feature-number">02</span><h3>调成你的颜色</h3><p>自由选择前景与背景色，调整导出尺寸。外观会被记住，下次打开直接用。</p><div className="color-dots" aria-label="支持自定义颜色"><i /><i /><i /><i /></div></article>
          <article><span className="feature-icon"><ArrowDown /></span><span className="feature-number">03</span><h3>存下来，随处分享</h3><p>下载 PNG 图片或 SVG 矢量图。发给朋友、放进文档，或在大屏上展示。</p><div className="format-tags"><span>PNG</span><span>SVG</span><span>256–2048 px</span></div></article>
        </div>
      </section>
      <section className="installation shell" id="install" aria-labelledby="install-title">
        <div className="install-intro"><p className="eyebrow">现在就用</p><h2 id="install-title">一分钟，<br />放进你的工具栏。</h2><p>商店版本准备期间，<br />可以通过 Chrome 开发者模式安装。</p><a href="/downloads/page-qr-extension-1.0.1.zip" download className="plain-link">下载安装包 <Download size={17} /></a></div>
        <ol className="steps">
          <li><span>1</span><div><h3>下载并解压</h3><p>下载上方安装包，解压到一个长期保留的文件夹。</p></div></li>
          <li><span>2</span><div><h3>加载到 Chrome</h3><p>地址栏输入 <code>chrome://extensions</code>，打开「开发者模式」，点击「加载已解压的扩展程序」，选择解压后的文件夹。</p></div></li>
          <li><span>3</span><div><h3>固定，然后点一下</h3><p>在扩展程序菜单中固定「页码」。打开一个网页，点击工具栏图标，即可扫码。</p></div></li>
        </ol>
      </section>
      <section className="privacy-banner shell" aria-labelledby="privacy-title"><div className="privacy-symbol"><ShieldCheck size={38} /></div><div><p className="eyebrow">少一点权限，多一点安心</p><h2 id="privacy-title">分享内容，不分享你的数据。</h2><p>网址和二维码内容只在弹窗中处理。没有上传、浏览记录收集或广告追踪，只在本机保存颜色与尺寸。</p></div><a href="/privacy" className="privacy-link">阅读隐私政策 <ChevronRight size={18} /></a></section>
    </main>
    <footer className="site-footer shell"><a className="brand" href="/"><img src="/page-qr-icon.png" width="28" height="28" alt="" /><strong>页码<span>PAGE QR</span></strong></a><p>一个让网页分享更轻松的小工具。</p><div><a href="/privacy">隐私政策</a><a href={`${repository}/issues`}>反馈问题</a><a href={repository}>Agent Club <ExternalLink size={13} /></a></div></footer>
  </>;
}
