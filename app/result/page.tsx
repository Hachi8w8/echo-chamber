import { Metadata } from "next"
import ResultPageContent from "./ResultPageContent"

export const metadata: Metadata = {
  title: "思考バイアス診断結果 | Echo Chamber",
  description: "あなたの情報の偏り、可視化してみませんか？思考傾向を分析して新しい視点を発見しましょう。",
  openGraph: {
    title: "思考バイアス診断結果",
    description: "あなたの情報の偏り、可視化してみませんか？",
    images: [
      {
        // 🚧 TODO: 本番時にドメインを変更する
        url: "https://echo-chamber-git-develop-mimibels-projects.vercel.app/ogp/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Echo Chamber - 思考傾向分析結果",
      },
    ],
    type: "website",
    // 🚧 TODO: 本番時にドメインを変更する
    url: "https://echo-chamber-git-develop-mimibels-projects.vercel.app/start",
  },
  twitter: {
    card: "summary_large_image",
    title: "思考バイアス診断",
    description: "あなたの情報の偏り、可視化してみませんか？",
    // 🚧 TODO: 本番時にドメインを変更する
    images: ["https://echo-chamber-git-develop-mimibels-projects.vercel.app/ogp/thumbnail.png"],
  },
}

// Server ComponentからClient Componentをレンダリング
export default function ResultPage() {
  return <ResultPageContent />
}
