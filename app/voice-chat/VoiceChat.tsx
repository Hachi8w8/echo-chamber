"use client"

import { useEffect, useState, useRef } from "react";
import { useLiveAPI } from "@/hooks/use-live-api";
import { LiveClientOptions } from "@/types/voice";
import VoiceControls from "@/components/voice/VoiceControls";
import { LiveConnectConfig, Modality } from "@google/genai";
import Image from "next/image";
// import VoiceVisualizer from "@/components/voice/VoiceVisualizer";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("NEXT_PUBLIC_GEMINI_API_KEY が設定されていません");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

interface VoiceChatProps {
  results: any;
}

export default function VoiceChat({ results }: VoiceChatProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAITalking, setIsAITalking] = useState(false);
  const [isBounceOnce, setIsBounceOnce] = useState(false);
  const [isBounceFinish, setIsBounceFinish] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const speakingThreshold = 0.01;
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    client,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
    setModel,
  } = useLiveAPI(apiOptions);

  // swipe結果に基づいてAIの視点を設定
  useEffect(() => {
    if (results && !isInitialized) {
      const userPerspective = results.user?.perspective || "";
      const oppositePerspective = results.opposite?.perspective || "";
      
      // 動的システムプロンプト生成
      const systemPrompt = `
あなたは建設的な議論を好む日本人です。

ユーザーは以下のような考え方を持っています：
${userPerspective}

しかし、異なる視点として以下のような考え方もあります：
${oppositePerspective}

あなたはこの異なる視点の立場から、ユーザーと建設的で興味深い議論を行ってください。
- 必ず日本語のみで答えてください
- 攻撃的にならず、相手の意見を尊重しながら異なる視点を提示してください
- 回答は1文か2文以内で簡潔に
- 具体例や質問を使って対話を深めてください

まずはユーザーに挨拶して、どのようなテーマについて話したいか聞いてください。
      `.trim();

      const config: LiveConnectConfig = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          languageCode: "ja-JP"
        },
        systemInstruction: {
          parts: [{
            text: systemPrompt
          }]
        }
      };

      setModel("models/gemini-2.0-flash-exp");
      setConfig(config);
      setIsInitialized(true);
    }
  }, [results, setConfig, isInitialized, setModel]);

  useEffect(() => {
    if (!client) return;
    const handleStart = () => {
      setIsBounceOnce(false);
      setIsAITalking(true);
    };
    const handleEnd = () => {
      setIsAITalking(false);
      setIsBounceOnce(true);
      setTimeout(() => setIsBounceOnce(false), 1200); // アニメーション1周期分
    };

    client.on('audio', handleStart);
    client.on('content', handleStart);
    client.on('turncomplete', handleEnd);

    return () => {
      client.off('audio', handleStart);
      client.off('content', handleStart);
      client.off('turncomplete', handleEnd);
    };
  }, [client]);

  useEffect(() => {
    if (isBounceOnce) {
      // bounce-onceが終わるタイミングでふわっと着地
      const finishTimeout = setTimeout(() => {
        setIsBounceFinish(true);
        setTimeout(() => setIsBounceFinish(false), 500); // 0.5sでリセット
      }, 1200); // bounce-onceの周期と合わせる
      return () => clearTimeout(finishTimeout);
    }
  }, [isBounceOnce]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isUserSpeaking) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isUserSpeaking]);

  return (
    <div className="flex flex-col items-center h-full w-full bg-white py-8 px-4">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* キャラクター画像＋ビジュアライザー */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: '80vw',
            maxWidth: 480,
            minWidth: 160,
            aspectRatio: '1/1',
          }}
        >
          <Image
            src="/test.png"
            alt="AIキャラクター"
            fill
            className={`object-contain ${isAITalking ? "bounce-slow" : isBounceOnce ? "bounce-once" : isBounceFinish ? "bounce-finish" : ""}`}
          />
        </div>
        {/* ビジュアライザー動画（常に表示、画面幅に合わせて下部に寄せる） */}
        <div className="flex flex-1 flex-col items-center justify-end w-full">
          <video
            ref={videoRef}
            src="/circle-white-unscreen.mp4"
            loop
            muted
            className="w-[40vw] max-w-[180px] min-w-[80px] aspect-square mb-8"
          />
        </div>
        {/* <VoiceVisualizer inVolume={Math.max(inVolume, volume)} /> */}
      </div>
      {/* マイクボタン（VoiceControls）を下部に */}
      <VoiceControls
        connected={connected}
        connect={connect}
        disconnect={disconnect}
        client={client}
        volume={volume}
        onInVolume={(v) => {
          if (v > speakingThreshold) {
            setIsUserSpeaking(true);
            if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = setTimeout(() => setIsUserSpeaking(false), 600);
          } else {
            if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = setTimeout(() => setIsUserSpeaking(false), 600);
          }
        }}
      />
    </div>
  );
} 