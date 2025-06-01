import { VeoRequest, VeoResponse, VeoOperationResponse } from '../../types/vertex-ai/veo';
import * as fs from 'fs-extra';
import path from 'path';
import { GoogleAuthProvider } from '../auth';

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'sekairoscope';
const LOCATION = 'us-central1';
const MODEL = 'veo-2.0-generate-001';
const API_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predictLongRunning`;
const POLLING_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:fetchPredictOperation`;

/**
 * Veo2 APIクライアント
 */
export class VeoClient {
  constructor() {}

  /**
   * 動画を生成する
   */
  async generateVideo(
    prompt: string,
    durationSeconds: number,
    aspectRatio?: string
  ): Promise<string> {
    try {
      console.log('Authenticating with GCP...');
      const token = await GoogleAuthProvider.getAccessToken();
      console.log('Authentication successful');

      // APIリクエストの構築
      const request: VeoRequest = {
        instances: [{
          prompt
        }],
        parameters: {
          durationSeconds,
          aspectRatio
        }
      };

      console.log('Calling Veo2 API...');
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: VeoResponse = await response.json();
      if (!data.name) {
        throw new Error('操作名が含まれていません');
      }

      // 長時間実行操作の完了を待機
      const result = await this.pollOperation(data.name, token);
      
      // 動画データの処理
      if (result.response?.videos?.[0]?.bytesBase64Encoded) {
        // 動画データをデコード
        const videoBuffer = Buffer.from(result.response.videos[0].bytesBase64Encoded, 'base64');
        
        // ファイル名の生成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `video_${timestamp}.mp4`;

        // tmpディレクトリに保存
        const outputDir = path.join(process.cwd(), 'tmp', 'videos');
        await fs.ensureDir(outputDir);
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, videoBuffer);

        return `/tmp/videos/${fileName}`;
      } else {
        console.error('Video data not found in response');
        console.error(result);
        // サンプル動画のパスを返す
        return `/tmp/videos/error.mp4`;
      }

    } catch (error) {
      console.error('Error generating video:', error);
      throw error instanceof Error ? error : new Error('動画生成に失敗しました');
    }
  }

  /**
   * 長時間実行操作の完了を待機する
   */
  private async pollOperation(operationName: string, token: string): Promise<VeoOperationResponse> {
    const maxAttempts = 30; // 5分間（10秒 × 30回）
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(POLLING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ operationName }),
        });

        if (!response.ok) {
          throw new Error(`Polling error: ${response.status} ${response.statusText}`);
        }

        const result: VeoOperationResponse = await response.json();
        
        if (result.done) {
          return result;
        }

        console.log(`Polling attempt ${attempt + 1}`);

        // 10秒待機
        await new Promise(resolve => setTimeout(resolve, 10000));
        
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error);
        throw error instanceof Error ? error : new Error('ポーリング中にエラーが発生しました');
      }
    }

    throw new Error('操作がタイムアウトしました');
  }
}

// シングルトンインスタンスをエクスポート
export const veoClient = new VeoClient();