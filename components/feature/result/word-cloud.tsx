"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface WordCloudProps {
  keywords: string[]
  onKeywordClick: (keyword: string) => void
  theme?: "light" | "dark"
}

// カラーパレットを関数の外部に移動して、レンダリングごとに再作成されないようにする
const LIGHT_COLORS = [
  "#ff5c8d", // ピンク
  "#3b7ff2", // ブルー
  "#ff6347", // オレンジ
  "#ffba08", // イエロー
  "#00c896", // グリーン
]

const DARK_COLORS = [
  "#ff7eb6", // 明るいピンク
  "#7eb6ff", // 明るいブルー
  "#ff9e7e", // 明るいオレンジ
  "#ffe07e", // 明るいイエロー
  "#7effcf", // 明るいグリーン
]

export default function WordCloud({ keywords, onKeywordClick, theme = "light" }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<
    Array<{ x: number; y: number; size: number; color: string; angle: number }>
  >([])
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; color: string }>>([])

  // テーマに応じたカラーパレットを選択
  const colors = theme === "light" ? LIGHT_COLORS : DARK_COLORS

  useEffect(() => {
    if (!containerRef.current) return

    // ✅　　バージョン01 ランダム
    // const container = containerRef.current
    // const width = container.clientWidth
    // const height = container.clientHeight
    // const centerX = width / 2
    // const centerY = height / 2

    // const newPositions = keywords.map((keyword, index) => {
    //   // インデックスベースでフォントサイズを決定（例: 16〜40pxの範囲で段階的に）
    //   const max = 40
    //   const min = 16
    //   const step = (max - min) / Math.max(1, keywords.length - 1)
    //   const size = Math.round(max - index * step)

    //   // スパイラル状に配置するための角度と半径
    //   const angle = index * 0.5 * Math.PI
    //   const radius = 20 + index * 15 + size / 2

    //   // 中心からの距離に基づいて座標を計算
    //   const x = centerX + Math.cos(angle) * radius
    //   const y = centerY + Math.sin(angle) * radius

    //   // ランダムな色を選択
    //   const color = colors[index % colors.length]

    //   // ランダムな回転角度
    //   const textAngle = Math.random() * 30 - 15

    //   return { x, y, size, color, angle: textAngle }
    // })
    // ✅　　バージョン01 ランダム　ここまで

    // ✅　✅　　バージョン02 多角形
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    const centerX = width / 2
    const centerY = height / 2
    const radius = 120 // 適宜調整

    const N = keywords.length // 例: 10個なら正十角形
    const newPositions = keywords.map((keyword, index) => {
      // 角度を等分割
      const angle = (2 * Math.PI * index) / N - Math.PI / 2 // 上からスタート
      let r = radius
      // 一番上と一番下の頂点だけ外側に
      if (index === 0 || index === Math.floor(N / 2)) {
        r = radius + 30 // 30px外側に
      }

      const x = centerX + Math.cos(angle) * r
      const y = centerY + Math.sin(angle) * r
      const isMobile = window.innerWidth <= 640
      const size = isMobile ? 18 : 24
      const color = colors[index % colors.length]
      return { x, y, size, color, angle: 0 }
    })
    // ✅　　バージョン02 多角形　ここまで

    // ✅　　バージョン03 バラバラ
    // const container = containerRef.current
    // const width = container.clientWidth
    // const height = container.clientHeight
    // const centerX = width / 2
    // const centerY = height / 2
    // const radius = 120 // 適宜調整
    // const N = keywords.length

    // const newPositions = keywords.map((keyword, index) => {
    //   const angle = (2 * Math.PI * index) / N - Math.PI / 2
    //   // 半径にばらつき
    //   let r = radius + Math.random() * 30 - 15
    //   if (index === 0 || index === Math.floor(N / 2)) {
    //     r += 30
    //   }
    //   const x = centerX + Math.cos(angle) * r
    //   const y = centerY + Math.sin(angle) * r
    //   // フォントサイズにもばらつき
    //   const size = Math.floor(Math.random() * (36 - 18 + 1)) + 18
    //   const color = colors[index % colors.length]
    //   return { x, y, size, color, angle: 0 }
    // })
    // ✅　　バージョン03 バラバラ　ここまで

    // ✅　✅　　バージョン04 放射状
    // const container = containerRef.current
    // const width = container.clientWidth
    // const height = container.clientHeight
    // const centerX = width / 2
    // const centerY = height / 2
    // const radius = 120 // 適宜調整
    // const N = keywords.length

    // const newPositions = keywords.map((keyword, index) => {
    // const angle = (2 * Math.PI * index) / N - Math.PI / 2
    // // 放射状にするため、半径をインデックスで大きく
    // const r = radius + (index % 2 === 0 ? 40 : -20)
    // const x = centerX + Math.cos(angle) * r
    // const y = centerY + Math.sin(angle) * r
    // const isMobile = window.innerWidth <= 640
    // const size = isMobile ? 18 : 24
    // const color = colors[index % colors.length]
    // return { x, y, size, color, angle: 0 }
    // })
    // ✅　　バージョン04 放射状　ここまで

  // })

    setPositions(newPositions)

    // キーワード間の接続線を生成
    const newLines = []
    for (let i = 0; i < newPositions.length; i++) {
      // 各キーワードから最も近い2つのキーワードへの線を引く
      const distances = newPositions
        .map((pos, idx) => ({
          idx,
          distance: Math.sqrt(Math.pow(newPositions[i].x - pos.x, 2) + Math.pow(newPositions[i].y - pos.y, 2)),
        }))
        .filter((item) => item.idx !== i) // 自分自身を除外
        .sort((a, b) => a.distance - b.distance) // 距離で並べ替え
        .slice(0, 2) // 最も近い2つを選択

      for (const { idx } of distances) {
        // 線の色はキーワードの色を薄くしたもの
        const color = newPositions[i].color + "40" // 透明度を追加
        newLines.push({
          x1: newPositions[i].x,
          y1: newPositions[i].y,
          x2: newPositions[idx].x,
          y2: newPositions[idx].y,
          color,
        })
      }
    }
    setLines(newLines)
  }, [keywords, theme])

  return (
    <div ref={containerRef} className="word-cloud-container relative w-full h-[400px]">
      {/* 背景パターン */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              theme === "light"
                ? "radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)"
                : "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>
      </div>

      {/* 中心の円 */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
          boxShadow: theme === "light" ? "0 0 20px rgba(0,0,0,0.1)" : "0 0 20px rgba(255,255,255,0.1)",
        }}
      ></div>

      {/* 接続線 */}
      <svg className="absolute inset-0 w-full h-full">
        {lines.map((line, index) => (
          <motion.line
            key={`line-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.color}
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        ))}
      </svg>

      {/* キーワード */}
      {positions.map((position, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: position.x - 50, // 中央揃えのための調整
            y: position.y - position.size / 2,
            rotate: position.angle,
          }}
          transition={{
            delay: index * 0.05,
            duration: 0.5,
            type: "spring",
            stiffness: 100,
          }}
          className="word-cloud-word absolute cursor-pointer"
          style={{
            fontSize: `${position.size}px`,
            color: position.color,
            fontWeight: "bold",
            textShadow: theme === "dark" ? "0 0 10px rgba(255,255,255,0.2)" : "none",
            padding: "5px 10px",
            borderRadius: "4px",
            background: theme === "light" ? `${position.color}10` : `${position.color}20`,
            border: `1px solid ${position.color}30`,
            zIndex: 10,
          }}
          onClick={() => onKeywordClick(keywords[index])}
          whileHover={{
            scale: 1.1,
            boxShadow: theme === "light" ? "0 5px 15px rgba(0,0,0,0.1)" : "0 5px 15px rgba(0,0,0,0.3)",
          }}
        >
          {keywords[index]}
        </motion.div>
      ))}
    </div>
  )
}
