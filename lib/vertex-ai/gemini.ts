import { GeminiRequest, GeminiResponse } from '../../types/vertex-ai/gemini';
import path from 'path';
import { GoogleAuthProvider } from '../auth';

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'sekairoscope';
const LOCATION = 'us-central1';
const MODEL = 'gemini-2.0-flash-lite-001';
//const MODEL = 'gemini-2.5-pro-preview-05-06';
const API_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

/**
 * Gemini APIクライアント
 */
export class GeminiClient {
  constructor() {}

  /**
   * テキストを生成する
   */
  async generateText(
    prompt: string,
    temperature?: number
  ): Promise<string> {
    try {
      console.log('Authenticating with GCP...');
      const token = await GoogleAuthProvider.getAccessToken();
      console.log('Authentication successful');
      // リクエストの作成
      const request: GeminiRequest = {
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generation_config: {
          responseMimeType: 'application/json',
          temperature: temperature
        }
      };

      console.log('Sending request to Gemini API:', {
        endpoint: API_ENDPOINT,
        payload: request
      });

      // APIリクエストの実行
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // エラーレスポンスの確認
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      try {
        // JSONとして直接解析
        const data: GeminiResponse = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));

        // レスポンスの検証
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('Invalid API response format');
        }

        return data.candidates[0].content.parts[0].text;
      } catch (parseError) {
        console.error('JSON解析エラー:', parseError);
        throw new Error('APIレスポンスの解析に失敗しました: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
      }

    } catch (error) {
      console.error('Error generating text:', error);
      throw new Error('テキスト生成に失敗しました: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
}

// シングルトンインスタンスをエクスポート
export const geminiClient = new GeminiClient();