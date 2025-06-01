"use client"

import { memo, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { AudioRecorder } from "@/lib/voice/audio-recorder";
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
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  return (
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
  );
}

export default memo(VoiceControls); 