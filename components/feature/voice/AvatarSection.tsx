"use client"

import React from "react";
import Image from "next/image";
import VoiceVisualizer from "./VoiceVisualizer";

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

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full">
      <Image
        src="/test.png"
        alt="AIキャラクター"
        width={150}
        height={150}
        priority
        className={`object-contain ${showIntro ? "intro-pop" : ""} ${
          isAITalking ? "talk-bounce" : ""
        }`}
      />
      <div className="mt-1">
        <VoiceVisualizer isActive={isSpeaking} />
      </div>
    </div>
  );
} 