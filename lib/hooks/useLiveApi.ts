import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GenAILiveClient } from "@/lib/voice/genai-live-client";
import { LiveClientOptions } from "@/types/voice";
import { AudioStreamer } from "@/lib/voice/audio-streamer";
import { audioContext } from "@/lib/voice/utils";
import VolMeterWorket from "@/lib/voice/worklets/vol-meter";
import { LiveConnectConfig, Modality, MediaResolution } from "@google/genai";

export type UseLiveAPIResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new GenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [model, setModel] = useState<string>("models/gemini-2.5-flash-preview-native-audio-dialog");
  const [config, setConfig] = useState<LiveConnectConfig>({
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
  });
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);

  // ログ関数を取得（VoiceChatのlog関数を使用）
  const logToVoiceChat = (msg: string, level: string = 'info') => {
    // グローバルにlog関数がある場合は使用
    if (typeof window !== 'undefined' && (window as any).voiceChatLog) {
      (window as any).voiceChatLog(msg, level);
    } else {
      console.log(`[useLiveAPI] ${msg}`);
    }
  };

  // addWorklet用のコールバックをuseCallbackでメモ化
  const handleVolume = useCallback((ev: any) => {
    setVolume(ev.data.volume);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      console.log('[useLiveAPI] onOpen発火');
      if (typeof window !== 'undefined' && (window as any).voiceChatLog) {
        (window as any).voiceChatLog('🎯 [DEBUG] useLiveAPI: onOpenイベント発火 - connectedをtrueに設定', 'success');
      }
      setConnected(true);
    };

    const onClose = () => {
      console.log('[useLiveAPI] onClose発火');
      if (typeof window !== 'undefined' && (window as any).voiceChatLog) {
        (window as any).voiceChatLog('🎯 [DEBUG] useLiveAPI: onCloseイベント発火 - connectedをfalseに設定', 'warn');
      }
      setConnected(false);
    };

    const onError = (error: ErrorEvent) => {
      console.error('[useLiveAPI] onError発火', error);
      if (typeof window !== 'undefined' && (window as any).voiceChatLog) {
        (window as any).voiceChatLog(`🎯 [DEBUG] useLiveAPI: onErrorイベント発火 - ${error.message}`, 'error');
      }
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .disconnect();
    };
  }, [client]);

  const connect = useCallback(async () => {
    logToVoiceChat('🎯 [DEBUG] useLiveAPI.connect()開始', 'api');
    console.log('[useLiveAPI] connect開始');
    if (!config) {
      throw new Error("config has not been set");
    }
    try {
      if (!audioStreamerRef.current) {
        logToVoiceChat('[useLiveAPI] audioContext初期化開始', 'api');
        console.log('[useLiveAPI] audioContext初期化開始');
        const audioCtx = await audioContext({ id: "audio-out" });
        logToVoiceChat('[useLiveAPI] audioContext初期化成功', 'success');
        console.log('[useLiveAPI] audioContext初期化成功', audioCtx);
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        try {
          console.log('[useLiveAPI] addWorklet開始');
          await audioStreamerRef.current.addWorklet<any>("vumeter-out", VolMeterWorket, handleVolume);
          console.log('[useLiveAPI] addWorklet成功');
        } catch (e) {
          logToVoiceChat(`[useLiveAPI] addWorklet失敗: ${e}`, 'error');
          console.error('[useLiveAPI] addWorklet失敗', e);
        }
      }
      console.log("🤖 使用モデル:", model);
      console.log("⚙️ 接続設定:", {
        responseModalities: config.responseModalities,
        languageCode: config.speechConfig?.languageCode,
        voiceName: config.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName
      });
      try {
        client.disconnect();
        logToVoiceChat('🎯 [DEBUG] client.connect()直前', 'api');
        console.log('[useLiveAPI] client.connect開始');
        await client.connect(model, config);
        logToVoiceChat('🎯 [DEBUG] client.connect()成功', 'success');
        console.log('[useLiveAPI] client.connect成功');
      } catch (e) {
        logToVoiceChat(`🎯 [DEBUG] client.connect()エラー: ${e}`, 'error');
        console.error('[useLiveAPI] client.connect失敗', e);
        throw e;
      }
    } catch (e) {
      logToVoiceChat(`🎯 [DEBUG] useLiveAPI.connect()全体エラー: ${e}`, 'error');
      console.error('[useLiveAPI] connect全体で失敗', e);
      throw e;
    }
  }, [client, config, model, handleVolume, logToVoiceChat]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [setConnected, client]);

  return {
    client,
    config,
    setConfig,
    model,
    setModel,
    connected,
    connect,
    disconnect,
    volume,
  };
} 