"use client"

import { useEffect, useState } from "react";
import { useLiveAPI } from "@/hooks/use-live-api";
import { LiveClientOptions } from "@/types/voice";
import VoiceControls from "@/components/voice/VoiceControls";
import { LiveConnectConfig, Modality } from "@google/genai";

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

  const {
    client,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
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

      setConfig(config);
      setIsInitialized(true);
    }
  }, [results, setConfig, isInitialized]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-4">
          異なる視点のAIと対話してみましょう
        </h2>
        <p className="text-gray-600 leading-relaxed">
          あなたの思考傾向とは異なる視点を持つAIと音声で対話できます。<br />
          「接続」ボタンを押して、マイクを有効にしてお話しください。
        </p>
      </div>

      {/* 接続状態表示 */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          connected 
            ? "bg-green-100 text-green-800" 
            : "bg-gray-100 text-gray-600"
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            connected ? "bg-green-500" : "bg-gray-400"
          }`}></div>
          {connected ? "AIに接続中" : "未接続"}
        </div>
      </div>

      {/* コントロール */}
      <VoiceControls
        connected={connected}
        connect={connect}
        disconnect={disconnect}
        client={client}
        volume={volume}
      />
    </div>
  );
} 