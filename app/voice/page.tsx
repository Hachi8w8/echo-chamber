"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useResults } from "@/lib/hooks/useResults";
import dynamic from "next/dynamic";

// 音声関連のコンポーネントを動的インポートでSSR無効化
const VoiceChat = dynamic(() => import("@/components/feature/voice/VoiceChat"), {
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">データが見つかりません</h1>
          <p className="text-gray-600 mb-4">まずはswipeページで診断を完了してください</p>
          <Button onClick={() => router.push("/")}>ホームに戻る</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* メインコンテンツ */}
      <VoiceChat results={results} onBackToResults={() => router.push('/result?from=voice')} />
    </div>
  );
}