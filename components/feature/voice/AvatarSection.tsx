"use client"

import React from "react";
import Image from "next/image";
import VoiceVisualizer from "./VoiceVisualizer";
import { useResults } from "@/lib/hooks/useResults"

interface AvatarSectionProps {
  isAITalking: boolean;
  isUserSpeaking: boolean;
  showIntro: boolean;
}

/**
 * キャラクター画像と縦棒ビジュアライザーをまとめた表示コンポーネント。
 * UI のみを担当し、音声ロジックには依存しない。
 */
export default function AvatarSection({ isAITalking, isUserSpeaking, showIntro }: AvatarSectionProps) {
  // isSpeaking 判定
  const isSpeaking = isUserSpeaking || isAITalking;
  const { data } = useResults()
  const oppositeImageUrl = data?.opposite?.imageUrl;

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full">
      {/* 丸いアバターアイコン（AICardと同じ構造） */}
      <div
        className={`w-40 h-40 mx-auto mb-2 rounded-full bg-gradient-to-br from-gray-800 via-blue-900 to-purple-900 flex items-center justify-center overflow-hidden relative shadow-lg ${showIntro ? "intro-pop" : ""} ${isAITalking ? "talk-bounce" : ""}`}
      >
        {/* 光る輪っか */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-950 to-purple-950 opacity-20 animate-spin"
          style={{ animationDuration: "8s" }}
        ></div>

        {/* アバター画像（next/image） */}
        <div className="w-36 h-36 rounded-full overflow-hidden shadow-md relative z-10">
          {oppositeImageUrl && (
            <Image
              src={oppositeImageUrl}
              alt="AIキャラクター"
              width={144}
              height={144}
              priority
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* キラキラエフェクト */}
        <div className="absolute top-5 right-5 animate-bounce text-sm" style={{ animationDelay: "0.5s" }}>
          ✨
        </div>
        <div className="absolute bottom-4 left-4 animate-bounce text-sm" style={{ animationDelay: "1s" }}>
          🌟
        </div>
      </div>
      <div className="mt-4">
        <VoiceVisualizer isActive={isSpeaking} />
      </div>
    </div>
  );
} 