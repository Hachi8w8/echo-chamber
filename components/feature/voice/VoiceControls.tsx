"use client"

import { memo, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { AudioRecorder } from "@/lib/voice/audio-recorder";
import DebugConsole from "./DebugConsole";
import classNames from "classnames";

// 開発モード判定（.env で NEXT_PUBLIC_IS_DEV=true に設定）
const isDev = process.env.NEXT_PUBLIC_IS_DEV === "true";

export type VoiceControlsProps = {
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  client: any;
  volume: number;
  onInVolume?: (v: number) => void;
};

function VoiceControls({
  connected,
  connect,
  disconnect,
  client,
  volume,
  onInVolume,
}: VoiceControlsProps) {
  const [inVolume, setInVolume] = useState(0);
  const latestVolume = useRef(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);



  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // 初期化時のテストログ（重要なもののみ）
  useEffect(() => {
    console.log("🚀 VoiceControls コンポーネント初期化");
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    console.log(`📱 デバイス: ${isMobile ? 'モバイル' : 'デスクトップ'}, プロトコル: ${window.location.protocol}`);
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error("❌ getUserMedia未対応");
    }
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
    let dataCount = 0;
    
    const onData = (base64: string) => {
      dataCount++;
      // 10回に1回だけログ出力（重要なもののみ）
      if (dataCount % 10 === 1) {
        console.log(`📡 音声データ送信中... (${dataCount}回目, ${base64.length}bytes)`);
        // VoiceChatのlog関数を使用
        if (typeof window !== 'undefined' && (window as any).voiceChatLog) {
          (window as any).voiceChatLog(`📡 音声データ送信中 (${dataCount}回目)`, 'audio');
        }
      }
      
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    
    const onVolumeChange = (volume: number) => {
      // Worklet から大量に呼ばれるのでメモリにのみ保持
      latestVolume.current = volume;
      // ここでは setState しない
    };
    
    if (connected && audioRecorder) {
      console.log("🔌 AudioRecorder開始処理...");
      if (typeof window !== 'undefined' && (window as any).voiceChatLog) {
        (window as any).voiceChatLog('🎯 [DEBUG] VoiceControls: connected=true, AudioRecorder開始処理', 'audio');
      }
      audioRecorder.on("data", onData).on("volume", onVolumeChange);
      audioRecorder.start().then(() => {
        console.log("✅ AudioRecorder開始成功");
        if (typeof window !== 'undefined' && (window as any).voiceChatLog) {
          (window as any).voiceChatLog('🎯 [DEBUG] AudioRecorder.start()成功', 'success');
        }
      }).catch((error) => {
        console.error("❌ AudioRecorder開始エラー:", error);
        if (typeof window !== 'undefined' && (window as any).voiceChatLog) {
          (window as any).voiceChatLog(`🎯 [DEBUG] AudioRecorder.start()エラー: ${error}`, 'error');
        }
      });
    } else {
      console.log("⏹️ AudioRecorder停止処理...");
      if (typeof window !== 'undefined' && (window as any).voiceChatLog) {
        (window as any).voiceChatLog(`🎯 [DEBUG] VoiceControls: connected=${connected}, AudioRecorder停止処理`, 'audio');
      }
      audioRecorder.stop();
    }
    
    return () => {
      audioRecorder.off("data", onData).off("volume", onVolumeChange);
    };
  }, [connected, client, audioRecorder]);

  // requestAnimationFrame で 1 フレームに 1 回だけ UI へ反映
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      setInVolume(latestVolume.current);
      if (onInVolume) onInVolume(latestVolume.current);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [onInVolume]);

  return (
    <div className="w-full">
      {/* クォータエラー表示 */}
      {quotaError && (
        <div className="bg-orange-100 border border-orange-300 rounded p-2 text-sm text-orange-800 mb-2 w-full text-center">
          ⚠️ API制限エラー: {quotaError}
          <button 
            onClick={() => setQuotaError(null)}
            className="ml-2 underline hover:no-underline"
          >
            閉じる
          </button>
        </div>
      )}

      {/* 右上の接続ボタン（開発環境のみ） */}
      {isDev && (
        <div className="fixed top-4 right-4 z-50 flex flex-row gap-2 items-center">
          <Button
            ref={connectButtonRef}
            size="sm"
            className={classNames(
              "rounded-full px-4 py-2 font-bold transition-all duration-200 text-base shadow flex items-center gap-2",
              {
                "bg-red-500 hover:bg-red-600 text-white": connected,
                "bg-blue-500 hover:bg-blue-600 text-white": !connected,
              }
            )}
            onClick={connected ? disconnect : connect}
          >
            {connected ? (<><Mic size={20} /> 切断</>) : (<><MicOff size={20} /> 接続</>)}
          </Button>
        </div>
      )}

      {/* 入力音量バー（非表示） */}
      <div style={{ display: 'none' }}>
        <div className="text-xs text-gray-500 mb-1">入力音量</div>
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-100"
            style={{ width: `${Math.min(inVolume * 500, 100)}%` }}
          />
        </div>
      </div>

      {/* 出力音量バー（非表示） */}
      <div style={{ display: 'none' }}>
        <div className="text-xs text-gray-500 mb-1">出力音量</div>
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${Math.min(volume * 500, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(VoiceControls); 