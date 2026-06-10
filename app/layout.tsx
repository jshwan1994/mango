import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
})

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mango-snowy.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '망고 Mango — 망설이지 말고, 운동 매칭',
  description:
    '오늘 저녁 빈자리 1명! 위치·시간·실력으로 30초 안에 매칭되는 종합 운동 플랫폼. 배드민턴·테니스·풋살·러닝·헬스 등 모든 운동.',
  keywords: ['망고', 'Mango', '운동 매칭', '운동 친구', '동네 운동', '배드민턴', '테니스', '풋살', '러닝'],
  openGraph: {
    title: '망고 Mango — 망설이지 말고',
    description: '30초 즉석 운동 매칭',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 256,
        height: 256,
        alt: '망고 Mango 로고',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: '망고 Mango — 망설이지 말고',
    description: '30초 즉석 운동 매칭',
    images: ['/opengraph-image.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--brand-bg-warm)]">
        {children}
      </body>
    </html>
  )
}
