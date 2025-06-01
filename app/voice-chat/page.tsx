"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useResults } from "@/lib/hooks/useResults";
import dynamic from "next/dynamic";

// 音声関連のコンポーネントを動的インポートでSSR無効化
const VoiceChat = dynamic(() => import("./VoiceChat"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">音声機能を読み込み中...</p>
      </div>
    </div>
  ),
});

export default function VoiceChatPage() {
  const router = useRouter();
  const { data: results } = useResults();

  // 結果データがない場合はリダイレクト
  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">データが見つかりません</h1>
          <p className="text-gray-600 mb-4">まずはswipeページで診断を完了してください</p>
          <Button onClick={() => router.push("/")}>ホームに戻る</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/result")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            結果画面に戻る
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">AI音声対話</h1>
          <div></div>
        </div>

        {/* メインコンテンツ */}
        <VoiceChat results={results} />

        {/* 使い方 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">💡 使い方</h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              <span>「接続」ボタンを押してAIに接続します</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              <span>マイクボタンが赤色になったら話しかけてください</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              <span>AIが音声で返答します。音量レベルを確認してください</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
              <span>自由に議論を楽しんでください！</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 