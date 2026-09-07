import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://page-qr.iambinlin.chatgpt.site'),
  title: { default: '页码 Page QR · 把这一页，扫码带走', template: '%s · 页码 Page QR' },
  description: '页码是一款轻巧的 Chrome 插件：一键生成当前网页二维码，自定义颜色与内容，下载 PNG 或 SVG。全部在本地完成。',
  icons: { icon: '/page-qr-icon.png' },
  openGraph: { title: '页码 Page QR', description: '把这一页，扫码带走。离线生成，自由配色。', locale: 'zh_CN', type: 'website' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
