import {
  Content,
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
} from "@google/genai";

import { EventEmitter } from "eventemitter3";
import { LiveClientOptions, StreamingLog } from "../../types/voice";
import { base64ToArrayBuffer } from "./utils";

/**
 * Event types that can be emitted by the MultimodalLiveClient.
 */
export interface LiveClientEventTypes {
  audio: (data: ArrayBuffer) => void;
  close: (event: CloseEvent) => void;
  content: (data: LiveServerContent) => void;
  error: (error: ErrorEvent) => void;
  interrupted: () => void;
  log: (log: StreamingLog) => void;
  open: () => void;
  setupcomplete: () => void;
  toolcall: (toolCall: LiveServerToolCall) => void;
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation
  ) => void;
  turncomplete: () => void;
}

/**
 * A event-emitting class that manages the connection to the websocket and emits
 * events to the rest of the application.
 */
export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  protected client: GoogleGenAI;

  private _status: "connected" | "disconnected" | "connecting" = "disconnected";
  public get status() {
    return this._status;
  }

  private _session: Session | null = null;
  public get session() {
    return this._session;
  }

  private _model: string | null = null;
  public get model() {
    return this._model;
  }

  protected config: LiveConnectConfig | null = null;

  public getConfig() {
    return { ...this.config };
  }

  constructor(options: LiveClientOptions) {
    super();
    this.client = new GoogleGenAI(options);
    this.send = this.send.bind(this);
    this.onopen = this.onopen.bind(this);
    this.onerror = this.onerror.bind(this);
    this.onclose = this.onclose.bind(this);
    this.onmessage = this.onmessage.bind(this);
  }

  protected log(type: string, message: StreamingLog["message"]) {
    const log: StreamingLog = {
      date: new Date(),
      type,
      message,
    };
    this.emit("log", log);
  }

  async connect(model: string, config: LiveConnectConfig): Promise<boolean> {
    console.log("🚀 GenAILiveClient.connect開始");
    console.log("📱 ステータス:", this._status);
    
    if (this._status === "connected" || this._status === "connecting") {
      console.log("⚠️ 既に接続中または接続済み、スキップ");
      return false;
    }

    this._status = "connecting";
    this.config = config;
    this._model = model;
    
    console.log("🔧 接続設定:");
    console.log("  - model:", model);
    console.log("  - config:", JSON.stringify(config, null, 2));

    const callbacks: LiveCallbacks = {
      onopen: this.onopen,
      onmessage: this.onmessage,
      onerror: this.onerror,
      onclose: this.onclose,
    };

    try {
      console.log("📡 GoogleGenAI.live.connect実行中...");
      this._session = await this.client.live.connect({
        model,
        config,
        callbacks,
      });
      console.log("🎉 GoogleGenAI.live.connect成功");
    } catch (e) {
      console.error("💥 GoogleGenAI.live.connectエラー:", e);
      
      // エラーの詳細分析
      const errorInfo = {
        name: e instanceof Error ? e.name : 'Unknown',
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        model: model,
        timestamp: new Date().toISOString()
      };
      
      console.error("🔍 エラー詳細分析:", errorInfo);
      
      // レートリミットの検出
      if (e instanceof Error && e.message) {
        const msg = e.message.toLowerCase();
        if (msg.includes('rate') || msg.includes('limit') || msg.includes('quota')) {
          console.error("🚫 レートリミット/クォータエラーの可能性:", e.message);
        }
        if (msg.includes('429')) {
          console.error("🚫 HTTP 429 Too Many Requests エラー");
        }
        if (msg.includes('model') || msg.includes('not found') || msg.includes('invalid')) {
          console.error("🚫 モデル関連エラーの可能性:", e.message);
        }
        if (msg.includes('auth') || msg.includes('api key') || msg.includes('permission')) {
          console.error("🚫 認証/APIキーエラーの可能性:", e.message);
        }
      }
      
      this._status = "disconnected";
      return false;
    }

    this._status = "connected";
    console.log("✨ GenAILiveClient接続完了");
    return true;
  }

  public disconnect() {
    if (!this.session) {
      return false;
    }
    this.session?.close();
    this._session = null;
    this._status = "disconnected";

    this.log("client.close", `Disconnected`);
    return true;
  }

  protected onopen() {
    this.log("client.open", "Connected");
    this.emit("open");
  }

  protected onerror(e: ErrorEvent) {
    console.error("🌐 WebSocketエラー:", {
      type: e.type,
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      timestamp: new Date().toISOString()
    });
    
    this.log("server.error", e.message);
    this.emit("error", e);
  }

  protected onclose(e: CloseEvent) {
    console.log("🔌 WebSocket接続終了:", {
      code: e.code,
      reason: e.reason,
      wasClean: e.wasClean,
      timestamp: new Date().toISOString()
    });
    
    // WebSocketクローズコードの解析
    if (e.code === 1008) {
      console.error("🚫 WebSocket Policy Violation (1008) - APIエラーの可能性");
    } else if (e.code === 1011) {
      console.error("🚫 WebSocket Unexpected Condition (1011) - サーバーエラー");
    } else if (e.code === 1012) {
      console.error("🚫 WebSocket Service Restart (1012) - サーバー再起動");
    } else if (e.code === 1013) {
      console.error("🚫 WebSocket Try Again Later (1013) - 一時的な過負荷");
    }
    
    this.log(
      `server.close`,
      `disconnected ${e.reason ? `with reason: ${e.reason}` : ``}`
    );
    this.emit("close", e);
  }

  protected async onmessage(message: LiveServerMessage) {
    console.log("📨 サーバーメッセージ受信:", {
      setupComplete: !!message.setupComplete,
      toolCall: !!message.toolCall,
      toolCallCancellation: !!message.toolCallCancellation,
      serverContent: !!message.serverContent
    });
    
    if (message.setupComplete) {
      console.log("⚙️ セットアップ完了");
      this.log("server.send", "setupComplete");
      this.emit("setupcomplete");
      return;
    }
    if (message.toolCall) {
      console.log("🔧 ツールコール受信");
      this.log("server.toolCall", message);
      this.emit("toolcall", message.toolCall);
      return;
    }
    if (message.toolCallCancellation) {
      console.log("❌ ツールコールキャンセル");
      this.log("server.toolCallCancellation", message);
      this.emit("toolcallcancellation", message.toolCallCancellation);
      return;
    }

    if (message.serverContent) {
      const { serverContent } = message;
      console.log("📝 サーバーコンテンツ:", {
        interrupted: "interrupted" in serverContent,
        turnComplete: "turnComplete" in serverContent,
        modelTurn: "modelTurn" in serverContent
      });
      
      if ("interrupted" in serverContent) {
        console.log("⏸️ 会話中断");
        this.log("server.content", "interrupted");
        this.emit("interrupted");
        return;
      }
      if ("turnComplete" in serverContent) {
        console.log("✅ ターン完了");
        this.log("server.content", "turnComplete");
        this.emit("turncomplete");
      }

      if ("modelTurn" in serverContent) {
        console.log("🤖 モデルターン開始");
        let parts: Part[] = serverContent.modelTurn?.parts || [];
        console.log("📦 パーツ数:", parts.length);

        // when its audio that is returned for modelTurn
        const audioParts = parts.filter(
          (p) => p.inlineData && p.inlineData.mimeType?.startsWith("audio/pcm")
        );
        const base64s = audioParts.map((p) => p.inlineData?.data);
        console.log("🔊 オーディオパーツ数:", audioParts.length);

        // strip the audio parts out of the modelTurn
        const otherParts = parts.filter(part => !audioParts.includes(part));
        console.log("📄 その他パーツ数:", otherParts.length);

        base64s.forEach((b64) => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit("audio", data);
            this.log(`server.audio`, `buffer (${data.byteLength})`);
            console.log("🎵 オーディオデータ送信:", data.byteLength, "bytes");
          }
        });
        if (!otherParts.length) {
          console.log("📭 オーディオのみのため、コンテンツイベントなし");
          return;
        }

        parts = otherParts;

        const content: { modelTurn: Content } = { modelTurn: { parts } };
        this.emit("content", content);
        this.log(`server.content`, message);
        console.log("📤 コンテンツイベント送信");
      }
    } else {
      console.log("❓ 未対応メッセージ:", message);
    }
  }

  /**
   * send realtimeInput, this is base64 chunks of "audio/pcm" and/or "image/jpg"
   */
  sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    let hasAudio = false;
    let hasVideo = false;
    for (const ch of chunks) {
      this.session?.sendRealtimeInput({ media: ch });
      if (ch.mimeType.includes("audio")) {
        hasAudio = true;
      }
      if (ch.mimeType.includes("image")) {
        hasVideo = true;
      }
      if (hasAudio && hasVideo) {
        break;
      }
    }
    const message =
      hasAudio && hasVideo
        ? "audio + video"
        : hasAudio
        ? "audio"
        : hasVideo
        ? "video"
        : "unknown";
    this.log(`client.realtimeInput`, message);
  }

  /**
   *  send a response to a function call and provide the id of the functions you are responding to
   */
  sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (
      toolResponse.functionResponses &&
      toolResponse.functionResponses.length
    ) {
      this.session?.sendToolResponse({
        functionResponses: toolResponse.functionResponses,
      });
      this.log(`client.toolResponse`, toolResponse);
    }
  }

  /**
   * send normal content parts such as { text }
   */
  send(parts: Part | Part[], turnComplete: boolean = true) {
    this.session?.sendClientContent({ turns: parts, turnComplete });
    this.log(`client.send`, {
      turns: Array.isArray(parts) ? parts : [parts],
      turnComplete,
    });
  }
} 