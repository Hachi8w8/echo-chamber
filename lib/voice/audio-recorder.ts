import { audioContext } from "./utils";
import AudioRecordingWorklet from "./worklets/audio-processing";
import VolMeterWorket from "./worklets/vol-meter";

import { createWorketFromSrc } from "./audioworklet-registry";
import EventEmitter from "eventemitter3";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  if (typeof window === 'undefined') {
    throw new Error('arrayBufferToBase64 is not available on server side');
  }
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {
    super();
  }

  async start() {
    if (typeof window === 'undefined') {
      throw new Error('AudioRecorder is not available on server side');
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }

    console.log("🎙️ AudioRecorder.start() 開始");

    this.starting = new Promise(async (resolve, reject) => {
      try {
        console.log("📱 マイクアクセス要求中...");
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ マイクストリーム取得成功:", this.stream);
        
        // オーディオトラックの詳細情報をログ出力
        const audioTracks = this.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          const track = audioTracks[0];
          const settings = track.getSettings();
          console.log("🎤 トラック詳細:", {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            settings: settings,
            sampleRate: settings.sampleRate,
            channelCount: settings.channelCount,
          });
        }

        console.log("🔧 AudioContext作成中...");
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        console.log("✅ AudioContext作成成功:", this.audioContext);
        
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        console.log("🔗 MediaStreamSource作成成功");
      } catch (error) {
        console.error("❌ マイクアクセスまたはAudioContext作成エラー:", error);
        reject(error);
        return;
      }

      console.log("🔧 AudioWorklet設定開始...");
      const workletName = "audio-recorder-worklet";
      const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

      console.log("📦 AudioWorkletモジュール追加中...");
      await this.audioContext.audioWorklet.addModule(src);
      console.log("✅ AudioWorkletモジュール追加成功");
      
      this.recordingWorklet = new AudioWorkletNode(
        this.audioContext,
        workletName,
      );
      console.log("🎵 AudioWorkletNode作成成功");

      this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
        // worklet processes recording floats and messages converted buffer
        const arrayBuffer = ev.data.data.int16arrayBuffer;

        console.log("🔊 AudioWorkletからデータ受信:", {
          hasArrayBuffer: !!arrayBuffer,
          bufferSize: arrayBuffer ? arrayBuffer.byteLength : 0,
          event: ev.data.event
        });

        if (arrayBuffer) {
          const arrayBufferString = arrayBufferToBase64(arrayBuffer);
          console.log("📤 音声データ送信準備完了, サイズ:", arrayBufferString.length);
          this.emit("data", arrayBufferString);
        }
      };
      
      this.source.connect(this.recordingWorklet);
      console.log("🔗 AudioWorklet接続完了");

      // vu meter worklet
      console.log("📊 VUメーター設定開始...");
      const vuWorkletName = "vu-meter";
      await this.audioContext.audioWorklet.addModule(
        createWorketFromSrc(vuWorkletName, VolMeterWorket),
      );
      console.log("✅ VUメーターモジュール追加成功");
      
      this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
      console.log("📊 VUメーターNode作成成功");
      
      this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
        console.log("🔉 音量データ受信:", ev.data.volume);
        this.emit("volume", ev.data.volume);
      };

      this.source.connect(this.vuWorklet);
      console.log("🔗 VUメーター接続完了");
      
      this.recording = true;
      console.log("🎤 録音開始完了！");
      resolve();
      this.starting = null;
    });
  }

  stop() {
    // its plausible that stop would be called before start completes
    // such as if the websocket immediately hangs up
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
    };
    if (this.starting) {
      this.starting.then(handleStop);
      return;
    }
    handleStop();
  }
} 