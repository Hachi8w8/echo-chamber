"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Share2, MessageCircle } from "lucide-react"
import WordCloud from "@/components/feature/word-cloud"
import VideoPlayer from "@/components/feature/video-player"
import KeywordModal from "@/components/feature/result/keywordModal"
import { useResults } from "@/lib/hooks/useResults"


export default function ResultPage() {
  const router = useRouter()
  const [selectedKeyword, setSelectedKeyword] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("opposite")
  // 結果の取得
  const { data } = useResults()
  console.log("ローカルからのデータ",data)

  // 各データ
  const userVideoUrl = data?.user?.videoUrl || ""
  const oppositeVideoUrl = data?.opposite?.videoUrl || ""
  const userPerspective = data?.user?.perspective || ""
  const oppositePerspective = data?.opposite?.perspective || ""
  const userKeywords = data?.user?.keywords || []
  const oppositeKeywords = data?.opposite?.keywords || []

  // タブに応じたスタイルを設定
  const bgColor = activeTab === "user" ? "bg-gray-100" : "bg-gray-900"
  const textColor = activeTab === "user" ? "text-black" : "text-white"
  const secondaryBgColor = activeTab === "user" ? "bg-white" : "bg-gray-800"
  const secondaryTextColor = activeTab === "user" ? "text-gray-800" : "text-gray-200"

  const handleKeywordClick = (keyword: any) => {
    setSelectedKeyword(keyword)
  }
  const handleCloseArticle = () => {
    setSelectedKeyword(null)
  }
  const handleShare = () => {
    // Twitterシェア機能
    const text = "あなたの情報の偏り、可視化してみませんか？"
    const url = window.location.href
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
    )
  }

  const handleRestart = () => {
    // ローカルストレージをクリアして最初から始める
    localStorage.removeItem("selectedThemes")
    localStorage.removeItem("responses")
    localStorage.removeItem("generatedCards")
    localStorage.removeItem("results")
    router.push("/")
  }

  if (!data) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">思考傾向を分析中...</h1>
          <div className="w-16 h-16 border-4 border-[#ffba08] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">少々お待ちください</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${bgColor} ${textColor}`}>
      <section className="pt-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold">{activeTab === "user" ? "あなたの思考傾向" : "異なる視点の思考傾向"}</h1>
          </motion.div>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-transparent">
              <TabsTrigger
                value="user"
                className="text-lg py-3 text-white data-[state=active]:bg-[#ffba08] data-[state=active]:text-white"
              >
                あなたの視点
              </TabsTrigger>
              <TabsTrigger
                value="opposite"
                className="text-lg py-3 data-[state=active]:bg-[#00c896] data-[state=active]:text-white"
              >
                異なる視点
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className={`overflow-hidden ${secondaryBgColor} border-0`}>
                  <CardContent className="p-0">
                    <VideoPlayer videoUrl={userVideoUrl} theme="light" />
                  </CardContent>
                  <p className="px-4 py-6 leading-7">{userPerspective}</p>
                </Card>

                <Card className={`${secondaryBgColor} border-0`}>
                  <CardContent className="p-6">
                    <h3 className={`text-2xl font-bold mb-4 ${secondaryTextColor}`}>キーワード分析</h3>
                    <WordCloud
                      keywords={userKeywords}
                      onKeywordClick={handleKeywordClick}
                      theme="light"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="opposite" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className={`overflow-hidden ${secondaryBgColor} border-0`}>
                  <CardContent className="p-0">
                   <VideoPlayer videoUrl={oppositeVideoUrl} theme="dark" />
                  </CardContent>
                  <p className="text-white px-4 py-6 leading-7">{oppositePerspective}</p>
                </Card>

                <Card className={`${secondaryBgColor} border-0`}>
                  <CardContent className="p-6">
                    <h3 className={`text-2xl font-bold mb-4 ${secondaryTextColor}`}>キーワード分析</h3>
                    <WordCloud
                      keywords={oppositeKeywords}
                      onKeywordClick={handleKeywordClick}
                      theme="dark"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap justify-center gap-4 mt-12 pb-10">
            <Button
              onClick={() => router.push('/voice')}
              className={`flex items-center gap-2 rounded-full px-6 py-2 ${
                activeTab === "user" ? "bg-green-500 text-white hover:bg-green-600" : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <MessageCircle size={18} />
              AIと音声で対話する
            </Button>
            <Button
              onClick={handleShare}
              className={`flex items-center gap-2 rounded-full px-6 py-2 ${
                activeTab === "user" ? "bg-black text-white hover:bg-gray-800" : "bg-white text-black hover:bg-gray-200"
              }`}
            >
              <Share2 size={18} />
              結果をシェアする
            </Button>
            <Button
              variant="outline"
              onClick={handleRestart}
              className={`rounded-full border-2 px-6 py-2 ${
                activeTab === "user"
                  ? "border-black text-black hover:bg-black/10"
                  : "border-white text-white bg-black hover:bg-white/10"
              }`}
            >
              もう一度はじめから
            </Button>
          </div>
        </div>
      </section>

      {selectedKeyword && (
        <KeywordModal
          selectedKeyword={selectedKeyword}
          activeTab={activeTab}
          handleCloseArticle={handleCloseArticle}
        />
      )}
    </div>
  )
}
