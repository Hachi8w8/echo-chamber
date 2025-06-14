"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import VoiceControls from "@/components/feature/voice/VoiceControls";
import { LiveConnectConfig, Modality } from "@google/genai";
import { useLiveAPI } from "@/lib/hooks/useLiveApi";
import { LiveClientOptions } from "@/types/voice";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("NEXT_PUBLIC_GEMINI_API_KEY が設定されていません");
}

const apiOptions: LiveClientOptions = { apiKey: API_KEY };

export default function VoicePromptTestPage() {
  const [prompts, setPrompts] = useState({
    system: "",
    start: "",
    timeup: "",
    end: "",
  });
  const voiceOptions = ["Puck","Charon","Kore","Fenrir","Aoede","Leda","Orus","Zephyr"] as const;
  const [voiceName,setVoiceName] = useState<typeof voiceOptions[number]>("Puck");

  const {
    client,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
  } = useLiveAPI(apiOptions);

  const timeupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInput = (field: keyof typeof prompts, value: string) => {
    setPrompts((prev) => ({ ...prev, [field]: value }));
  };

  const handleConnect = async () => {
    if (!prompts.system.trim()) return alert("システムプロンプトを入力してください");

    const config: LiveConnectConfig = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        languageCode: "ja-JP",
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
      systemInstruction: { parts: [{ text: prompts.system }] },
    };
    try {
      setConfig(config);
      await connect();
    } catch (e) {
      console.error("connect error", e);
    }
  };

  const scheduleTimeup = () => {
    if (timeupTimeoutRef.current) clearTimeout(timeupTimeoutRef.current);
    if (!prompts.timeup.trim()) return;
    timeupTimeoutRef.current = setTimeout(() => {
      if (client && typeof client.send === "function") {
        client.send({ text: prompts.timeup });
      }
    }, 60000);
  };

  const handleSend = (field: "start" | "timeup" | "end") => {
    if (!connected || !prompts[field].trim()) return;
    if (field === "timeup") {
      scheduleTimeup();
      alert("1分後に送信を再スケジュールしました");
    } else {
      client.send({ text: prompts[field] });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col gap-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-2">Voice Prompt Tester</h1>

      {/* システムプロンプト */}
      <div>
        <label className="font-semibold">システムプロンプト (接続前に設定)</label>
        <textarea
          rows={4}
          value={prompts.system}
          onChange={(e) => handleInput("system", e.target.value)}
          className="mt-1 w-full border rounded-md p-2 text-sm"
        />
      </div>

      {/* 各種プロンプト */}
      {([
        { key: "start", label: "開始プロンプト" },
        { key: "timeup", label: "1分経過プロンプト" },
        { key: "end", label: "終了プロンプト" },
      ] as const).map(({ key, label }) => (
        <div key={key}>
          <label className="font-semibold">{label}</label>
          <textarea
            rows={3}
            value={prompts[key]}
            onChange={(e) => handleInput(key, e.target.value)}
            className="mt-1 w-full border rounded-md p-2 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={!connected || !prompts[key].trim()}
            onClick={() => handleSend(key)}
          >
            {key === "timeup" ? "1分後に送信再設定" : "送信"}
          </Button>
        </div>
      ))}

      {/* 音声（VoiceName）選択 */}
      <div>
        <label className="font-semibold">音声（Voice Name）</label>
        <select
          className="mt-1 w-full border rounded-md p-2 text-sm bg-white"
          value={voiceName}
          onChange={(e)=>setVoiceName(e.target.value as typeof voiceOptions[number])}
          disabled={connected}
        >
          {voiceOptions.map(v=>(<option key={v} value={v}>{v}</option>))}
        </select>
      </div>

      {/* 接続制御 */}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleConnect} disabled={connected}>接続</Button>
        <Button className="flex-1" variant="outline" onClick={disconnect} disabled={!connected}>切断</Button>
      </div>

      {/* 音声テスト */}
      <VoiceControls
        connected={connected}
        connect={handleConnect}
        disconnect={disconnect}
        client={client}
        volume={volume}
      />
    </div>
  );
} 