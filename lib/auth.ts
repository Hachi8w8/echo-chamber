import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs-extra';
import path from 'path';

// GoogleAuth インスタンスを提供するクラス
export class GoogleAuthProvider {
  private static instance: GoogleAuth;

  // シングルトンパターンでインスタンスを取得
  public static getInstance(): GoogleAuth {
    if (!GoogleAuthProvider.instance) {
      const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

      if (serviceAccountJson) {
        try {
          // 環境変数から認証情報を使用（Vercel環境など）
          GoogleAuthProvider.instance = new GoogleAuth({
            credentials: JSON.parse(serviceAccountJson),
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
          });
          console.log('Using service account from environment variable');
        } catch (error) {
          console.error('環境変数からの認証情報パースエラー:', error);
          throw error;
        }
      } else {
        // ローカル開発環境用：ファイルから認証情報を使用
        const keyPath = path.join(process.cwd(), 'key', 'sekairoscope-3177be258b29.json');
        GoogleAuthProvider.instance = new GoogleAuth({
          keyFile: keyPath,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        console.log('Using service account from local file');
      }
    }
    
    return GoogleAuthProvider.instance;
  }

  // アクセストークンを取得するヘルパー関数
  public static async getAccessToken(): Promise<string> {
    try {
      const auth = GoogleAuthProvider.getInstance();
      const client = await auth.getClient();
      const token = await client.getAccessToken();
      
      if (!token.token) {
        throw new Error('認証トークンを取得できませんでした');
      }
      
      return token.token;
    } catch (error) {
      console.error('認証エラー:', error);
      throw error instanceof Error ? error : new Error('認証に失敗しました');
    }
  }
}
