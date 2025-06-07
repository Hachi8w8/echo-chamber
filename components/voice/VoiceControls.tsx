"use client"

import { memo, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { AudioRecorder } from "@/lib/voice/audio-recorder";
import DebugConsole from "./DebugConsole";
import classNames from "classnames";

export type VoiceControlsProps = {
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  client: any;
  volume: number;
};

function VoiceControls({
  connected,
  connect,
  disconnect,
  client,
  volume,
}: VoiceControlsProps) {
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // 初期化時のテストログ
  useEffect(() => {
    console.log("🚀 VoiceControls コンポーネント初期化");
    console.log("📱 UserAgent:", navigator.userAgent);
    console.log("🌐 Location:", window.location.href);
    console.log("🔒 Protocol:", window.location.protocol);
    console.log("🎙️ MediaDevices対応:", !!navigator.mediaDevices);
    console.log("🎤 getUserMedia対応:", !!navigator.mediaDevices?.getUserMedia);
  }, []);

  // クォータエラーの監視
  useEffect(() => {
    const handleWebSocketClose = (closeEvent: CloseEvent) => {
      console.log("🔍 WebSocket Close イベント受信:", closeEvent);
      
      if (closeEvent.reason) {
        const reason = closeEvent.reason.toLowerCase();
        console.log("🔍 Close reason:", reason);
        
        if (reason.includes('quota') || reason.includes('exceeded') || reason.includes('billing')) {
          console.log("🚨 クォータエラー検出！");
          setQuotaError('APIの使用量制限に達しました。しばらく待つか、モデルを変更して試してください。');
        }
      }
      
      // コード1011もクォータエラーの可能性が高い
      if (closeEvent.code === 1011) {
        console.log("🚨 WebSocketコード1011検出（クォータエラーの可能性）");
        setQuotaError('APIの使用量制限に達しました。しばらく待つか、モデルを変更して試してください。');
      }
    };

    client.on('close', handleWebSocketClose);

    return () => {
      client.off('close', handleWebSocketClose);
    };
  }, [client]);

  useEffect(() => {
    const onData = (base64: string) => {
      console.log("📡 音声データ送信:", {
        mimeType: "audio/pcm;rate=16000",
        dataSize: base64.length,
        firstChars: base64.substring(0, 20) + "..."
      });
      
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    
    const onVolumeChange = (volume: number) => {
      setInVolume(volume);
      if (volume > 0) {
        console.log("🎤 音量検出:", volume.toFixed(3));
      }
    };
    
    if (connected && !muted && audioRecorder) {
      console.log("🔌 AudioRecorder開始処理...");
      audioRecorder.on("data", onData).on("volume", onVolumeChange);
      
      audioRecorder.start().catch((error) => {
        console.error("❌ AudioRecorder開始エラー:", error);
      });
    } else {
      console.log("⏹️ AudioRecorder停止処理...");
      audioRecorder.stop();
    }
    
    return () => {
      audioRecorder.off("data", onData).off("volume", onVolumeChange);
    };
  }, [connected, client, muted, audioRecorder]);

  return (
    <div className="space-y-4">
      {/* クォータエラー表示 */}
      {quotaError && (
        <div className="bg-orange-100 border border-orange-300 rounded p-2 text-sm text-orange-800">
          ⚠️ API制限エラー: {quotaError}
          <button 
            onClick={() => setQuotaError(null)}
            className="ml-2 underline hover:no-underline"
          >
            閉じる
          </button>
        </div>
      )}

      {/* デバッグコンソール開閉ボタン */}
      <div className="text-center">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setShowDebugConsole(!showDebugConsole)}
        >
          {showDebugConsole ? "コンソール閉じる" : "🔍 デバッグコンソール"}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4 p-6 bg-gray-50 rounded-lg">
      {/* マイクボタン */}
      <Button
        variant="outline"
        size="lg"
        className={classNames(
          "rounded-full p-4 transition-all duration-200",
          {
            "bg-red-500 hover:bg-red-600 text-white": !muted && connected,
            "bg-gray-300 hover:bg-gray-400": muted || !connected,
          }
        )}
        onClick={() => setMuted(!muted)}
        disabled={!connected}
      >
        {!muted ? <Mic size={24} /> : <MicOff size={24} />}
      </Button>

      {/* 音量レベル表示 */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-600">入力音量:</div>
        <div 
          className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden"
        >
          <div 
            className="h-full bg-green-500 transition-all duration-100"
            style={{ width: `${Math.min(inVolume * 500, 100)}%` }}
          />
        </div>
      </div>

      {/* 接続ボタン */}
      <Button
        ref={connectButtonRef}
        size="lg"
        className={classNames(
          "rounded-full px-6 py-3 font-bold transition-all duration-200",
          {
            "bg-red-500 hover:bg-red-600 text-white": connected,
            "bg-blue-500 hover:bg-blue-600 text-white": !connected,
          }
        )}
        onClick={connected ? disconnect : connect}
      >
        {connected ? "切断" : "接続"}
      </Button>

      {/* 出力音量表示 */}
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-600">出力音量:</div>
        <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${Math.min(volume * 500, 100)}%` }}
          />
        </div>
        {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </div>
    </div>

    {/* デバッグコンソール */}
    <DebugConsole 
      isOpen={showDebugConsole}
      onClose={() => setShowDebugConsole(false)}
    />
  </div>
  );
}

export default memo(VoiceControls); 