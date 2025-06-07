/**
 * 画像生成APIのリクエスト・レスポンス型定義
 */

export interface ImageGenerationRequest {
  /** コンテンツ */
  contents: {
    /** ロール */
    role: "user";
    /** パーツ */
    parts: {
      /** テキストプロンプト */
      text: string;
    }[];
  }[];
  /** 生成設定 */
  generationConfig: {
    /** 温度パラメータ (0.0-2.0) */
    temperature?: number;
    /** 最大出力トークン数 */
    maxOutputTokens?: number;
    /** レスポンスモダリティ */
    responseModalities?: ("TEXT" | "IMAGE")[];
    /** TopP パラメータ */
    topP?: number;
  };
  /** 安全性設定 */
  safetySettings?: {
    /** カテゴリ */
    category: string;
    /** 閾値 */
    threshold: "OFF" | "BLOCK_ONLY_HIGH" | "BLOCK_MEDIUM_AND_ABOVE" | "BLOCK_LOW_AND_ABOVE";
  }[];
}

export interface ImageGenerationResponse {
  /** 候補（通常1つ） */
  candidates?: {
    /** コンテンツ */
    content?: {
      /** パーツ（通常1つ） */
      parts?: {
        /** テキスト */
        text?: string;
        /** インライン画像データ */
        inlineData?: {
          /** MIME タイプ */
          mimeType: string;
          /** Base64エンコードされたデータ */
          data: string;
        };
      }[];
    };
    /** 終了理由 */
    finishReason?: string;
    /** 安全性評価 */
    safetyRatings?: {
      /** カテゴリ */
      category: string;
      /** 確率 */
      probability: string;
    }[];
  }[];
  /** 使用統計 */
  usageMetadata?: {
    /** プロンプトトークン数 */
    promptTokenCount?: number;
    /** 候補トークン数 */
    candidatesTokenCount?: number;
    /** 総トークン数 */
    totalTokenCount?: number;
  };
}

export interface GeneratedImage {
  /** Base64エンコードされた画像データ */
  data: string;
  /** MIME タイプ */
  mimeType: string;
  /** テキスト（存在する場合のみ） */
  text?: string;
}
