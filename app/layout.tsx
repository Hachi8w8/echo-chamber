import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/feature/theme-provider"
import Navigation from "@/components/feature/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "セカイロスコープ | 思考バイアス可視化アプリ",
  description: "あなたの情報の偏り、可視化してみませんか？",
  generator: "v0.dev",

  // OGP設定を追加
  openGraph: {
    title: "セカイロスコープ | 思考バイアス可視化アプリ",
    description: "あなたの情報の偏り、可視化してみませんか？",
    images: [
      {
        // 🚧 TODO: 本番時にドメインを変更する
        url: "https://echo-chamber-ogp-test-only.vercel.app/ogp/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "セカイロスコープ - 思考バイアス可視化アプリ",
      },
    ],
    type: "website",
    // 🚧 TODO: 本番時にドメインを変更する
    url: "https://echo-chamber-ogp-test-only.vercel.app/start",
  },

  // Twitter設定を追加
  twitter: {
    card: "summary_large_image",
    title: "セカイロスコープ | 思考バイアス可視化アプリ",
    description: "あなたの情報の偏り、可視化してみませんか？",
    // 🚧 TODO: 本番時にドメインを変更する
    images: ["https://echo-chamber-ogp-test-only.vercel.app/ogp/thumbnail.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden overscroll-none h-full`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="grid grid-rows-[auto_1fr] h-full">
            <Navigation />
            <main className="h-full">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
