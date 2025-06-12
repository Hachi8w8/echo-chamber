import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AICardProps {
  imageUrl?: string
  text?: string
}

export function AICard({ imageUrl, text }: AICardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [visibleLines, setVisibleLines] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const router = useRouter()

  // セリフのテキスト配列
  const dialogueLines = ["あなたの世界も素敵だね。", `私の世界では、${text}`, "少しだけ、話してみない？"]

  // アニメーション開始
  const startAnimation = () => {
    setIsAnimating(true)
    setVisibleLines(0)

    // 各行を順番に表示
    dialogueLines.forEach((_, index) => {
      setTimeout(() => {
        setVisibleLines(index + 1)
        if (index === dialogueLines.length - 1) {
          setIsAnimating(false)
        }
      }, (index + 1) * 1000) // 1秒間隔
    })
  }

  // コンポーネントマウント時にアニメーション開始
  useEffect(() => {
    const timer = setTimeout(() => {
      startAnimation()
    }, 500) // 0.5秒後に開始

    return () => clearTimeout(timer)
  }, [text]) // textが変わったら再アニメーション

  return (
    <div className="w-full max-w-md mx-auto my-8">
      <Card className="bg-gradient-to-b p-6 md:p-8 from-[#FCF8F2] to-[#FFF8EC] border-0 shadow-lg">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-gray-800 mb-4">ちがう星から来た、あなたへ</h2>
        <p className="text-gray-600 mb-4 sm:mb-8 text-center text-sm sm:text-lg">
          あなたの価値観に、
          <br />
          そっと触れたい存在がいます。
        </p>
        <CardContent className="p-6 text-center bg-white rounded-lg shadow-md">
          {/* アバター */}
          <div className="mb-6 relative">
            <div
              className="w-40 h-40 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-800 via-blue-900 to-purple-900 flex items-center justify-center overflow-hidden relative shadow-lg animate-pulse"
              style={{
                animation: `gentle-float 3s ease-in-out infinite, soft-glow 2s ease-in-out infinite alternate`,
              }}
            >
              {/* 光る輪っか */}
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-950 to-purple-950 opacity-20 animate-spin"
                style={{ animationDuration: "8s" }}
              ></div>

              {/* アバター画像 */}
              <div className="w-36 h-36 rounded-full overflow-hidden shadow-md relative z-10">
                <img
                  src={imageUrl || "/api/images/sample1.png"}
                  alt="AI生成アバター"
                  className="w-full h-full object-cover transition-all duration-500 hover:scale-125"
                />
              </div>

              {/* キラキラエフェクト */}
              <div className="absolute top-5 right-5 animate-bounce text-sm" style={{ animationDelay: "0.5s" }}>
                ✨
              </div>
              <div className="absolute bottom-4 left-4 animate-bounce text-sm" style={{ animationDelay: "1s" }}>
                🌟
              </div>
            </div>
          </div>

          {/* メッセージ */}
          <div className="mb-8 relative">
            <div className="bg-gradient-to-r from-[#fcf8f2] to-[#f8f4ee] rounded-2xl p-5 shadow-md border-l-2 border-blue-300 relative min-h-[120px]">
              {/* 吹き出しの三角 */}
              <div className="absolute -top-2 left-8 w-4 h-4 bg-[#fcf8f2] transform rotate-45 border-l-2 border-t-2 border-blue-200"></div>

              <div className="text-left">
                {dialogueLines.map((line, index) => (
                  <p
                    key={index}
                    className={`text-gray-700 leading-relaxed transition-all duration-500 ${
                      index < visibleLines ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4"
                    }`}
                    style={{
                      transitionDelay: `${index * 100}ms`,
                    }}
                  >
                    {line}
                  </p>
                ))}

                {/* タイピングインジケーター */}
                {isAnimating && visibleLines < dialogueLines.length && (
                  <div className="inline-flex items-center gap-1 mt-2">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-[#436DB7] via-[#5B7BC7] to-[#7B8ED7] hover:from-[#2F63BE] hover:via-[#4A6BC0] hover:to-[#6B7EC8] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-white/20"
              size="lg"
              onClick={() => router.push('/voice')}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <span className="flex items-center justify-center gap-2">
                {isHovered ? "🚀" : "💭"}
                <span className="transition-all duration-300">1分だけ話してみる</span>
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes gentle-float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes soft-glow {
          0% {
            box-shadow: 0 0 20px rgba(123, 142, 215, 0.3);
          }
          100% {
            box-shadow: 0 0 30px rgba(123, 142, 215, 0.5);
          }
        }
      `}</style>
    </div>
  )
}

export default AICard
