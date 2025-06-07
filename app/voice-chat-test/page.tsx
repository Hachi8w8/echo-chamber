"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLiveAPI } from "@/hooks/use-live-api";
import { LiveClientOptions } from "@/types/voice";
import VoiceControls from "@/components/voice/VoiceControls";
import { LiveConnectConfig, Modality, MediaResolution } from "@google/genai";
import { RotateCcw } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("NEXT_PUBLIC_GEMINI_API_KEY が設定されていません");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

// デフォルトのシステムプロンプト（VoiceChat.tsxから）
const DEFAULT_SYSTEM_PROMPT = `あなたは建設的な議論を好む日本人です。

ユーザーは以下のような考え方を持っています：
（ここにユーザーの価値観が入ります）

しかし、異なる視点として以下のような考え方もあります：
（ここに対立する価値観が入ります）

あなたはこの異なる視点の立場から、ユーザーと建設的で興味深い議論を行ってください。
- 必ず日本語のみで答えてください
- 攻撃的にならず、相手の意見を尊重しながら異なる視点を提示してください
- 回答は1文か2文以内で簡潔に
- 具体例や質問を使って対話を深めてください

まずはユーザーに挨拶して、どのようなテーマについて話したいか聞いてください。`;

export default function VoiceChatTestPage() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isConfigured, setIsConfigured] = useState(false);

  const {
    client,
    setConfig,
    model,
    setModel,
    connected,
    connect,
    disconnect,
    volume,
  } = useLiveAPI(apiOptions);

  const handleSetPrompt = () => {
    const config: LiveConnectConfig = {
      responseModalities: [Modality.AUDIO],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        languageCode: "ja-JP",
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Zephyr",
          },
        },
      },
      contextWindowCompression: {
        triggerTokens: "25600",
        slidingWindow: { targetTokens: "12800" },
      },
      systemInstruction: {
        parts: [{
          text: systemPrompt
        }]
      }
    };

    setConfig(config);
    setIsConfigured(true);
  };

  const handleReset = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setIsConfigured(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">音声対話テスト画面</h1>
          <p className="text-gray-600">システムプロンプトを編集してLive APIの音声会話をテストできます</p>
          
          {/* モデル切り替えボタン */}
          <div className="mt-4 flex justify-center gap-2">
            <Button
              variant={model.includes("2.0") ? "default" : "outline"}
              size="sm"
              onClick={() => setModel("models/gemini-2.0-flash-exp")}
              disabled={connected}
            >
              Gemini 2.0 Flash
            </Button>
            <Button
              variant={model.includes("2.5") ? "default" : "outline"}
              size="sm"
              onClick={() => setModel("models/gemini-2.5-flash-preview-native-audio-dialog")}
              disabled={connected}
            >
              Gemini 2.5 Native Audio
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            現在のモデル: {model.includes("2.0") ? "2.0 Flash" : "2.5 Native Audio"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* プロンプト編集エリア */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">システムプロンプト編集</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw size={16} />
                リセット
              </Button>
            </div>
            
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="システムプロンプトを入力してください..."
              className="w-full min-h-[400px] font-mono text-sm mb-4 p-3 border border-gray-300 rounded-lg resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <Button
              onClick={handleSetPrompt}
              className="w-full"
              disabled={!systemPrompt.trim()}
            >
              このプロンプトで設定
            </Button>
            
            {isConfigured && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ プロンプトが設定されました。「接続」ボタンで音声対話を開始できます。
                </p>
              </div>
            )}
          </div>

          {/* 音声対話エリア */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">音声対話テスト</h2>
            
            {!isConfigured ? (
              <div className="text-center py-20">
                <p className="text-gray-500 mb-4">まずはシステムプロンプトを設定してください</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* 使い方説明 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">💡 使い方</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">基本的な流れ</h4>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. システムプロンプトを編集</li>
                <li>2. 「このプロンプトで設定」をクリック</li>
                <li>3. 「接続」ボタンでAIに接続</li>
                <li>4. マイクを有効にして対話開始</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">注意点</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• プロンプト変更時は再設定が必要</li>
                <li>• 日本語での指示を推奨</li>
                <li>• 接続前にプロンプトを設定</li>
                <li>• 音量レベルを確認してください</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 