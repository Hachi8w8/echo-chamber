import { 
  ImageGenerationRequest, 
  ImageGenerationResponse,
  GeneratedImage 
} from '../../types/vertex-ai/image';
import { GoogleAuthProvider } from '../auth';
import * as fs from 'fs-extra';
import path from 'path';

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'sekairoscope';
const LOCATION = 'global';
const MODEL = 'gemini-2.0-flash-preview-image-generation';
const API_ENDPOINT = `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:streamGenerateContent`;

/**
 * Gemini 2.0 Flash Preview Image Generation APIクライアント
 */
export class ImageGenerationClient {
  constructor() {}  /**
   * テキストプロンプトから画像を生成し、tmpディレクトリに保存する
   */
  async generateImage(
    prompt: string,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      includeSafetySettings?: boolean;
    }
  ): Promise<{ imagePath: string; text?: string }> {
    try {
      console.log('Authenticating with GCP...');
      const token = await GoogleAuthProvider.getAccessToken();
      console.log('Authentication successful');

      // デフォルトのオプション
      const {
        temperature = 1,
        maxOutputTokens = 8192,
        topP = 1,
        includeSafetySettings = true
      } = options || {};

      // 安全性設定
      const safetySettings = includeSafetySettings ? [
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "OFF" as const
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "OFF" as const
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "OFF" as const
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "OFF" as const
        },
        {
          category: "HARM_CATEGORY_IMAGE_HATE",
          threshold: "OFF" as const
        },
        {
          category: "HARM_CATEGORY_IMAGE_DANGEROUS_CONTENT",
          threshold: "OFF" as const
        },
        {
          category: "HARM_CATEGORY_IMAGE_HARASSMENT",
          threshold: "OFF" as const
        },
        {
          category: "HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT",
          threshold: "OFF" as const
        }
      ] : [];

      // リクエストの作成
      const request: ImageGenerationRequest = {
        contents: [{
          role: "user",
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseModalities: ["TEXT", "IMAGE"],
          topP
        },
        safetySettings
      };

      console.log('Sending request to Image Generation API:', {
        endpoint: API_ENDPOINT,
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        temperature,
        maxOutputTokens,
        topP
      });

      // APIリクエストの実行
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });      // エラーレスポンスの確認
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Image Generation API error: ${response.status} ${response.statusText}`);
      }      try {
        // レスポンスの解析
        const responseText = await response.text();
        
        // Raw API Responseを短縮して出力（長いBase64データを短縮）
        let truncatedResponse = responseText;
        
        // Base64データのパターンをより確実に検出して短縮
        truncatedResponse = truncatedResponse.replace(
          /"data"\s*:\s*"[A-Za-z0-9+/=]{100,}"/g,
          (match) => {
            const colonIndex = match.indexOf(':');
            const quoteIndex = match.indexOf('"', colonIndex + 1);
            const dataStart = quoteIndex + 1;
            const truncated = match.substring(0, dataStart + 50) + '...truncated..."';
            return truncated;
          }
        );
        
        console.log('Raw API Response (Base64 data truncated):', truncatedResponse);        // JSONレスポンスを解析（配列またはオブジェクト）
        const responseData = JSON.parse(responseText);
        let foundImage: GeneratedImage | null = null;
        
        // レスポンスが配列の場合と単一オブジェクトの場合を処理
        const responseArray = Array.isArray(responseData) ? responseData : [responseData];
          // 全てのテキストと画像データを収集
        let allTextParts: string[] = [];
        let imageData: { data: string; mimeType: string } | null = null;
        
        for (const data of responseArray) {
          console.log('=== Processing Response ===');
            // candidatesがある場合の詳細出力
          if (data.candidates) {
            data.candidates.forEach((candidate: any, index: number) => {
              console.log(`--- Candidate ${index} ---`);
              console.log(`finishReason: ${candidate.finishReason || 'undefined'}`);
              
              // partsがある場合の詳細出力
              if (candidate.content?.parts) {
                candidate.content.parts.forEach((part: any, partIndex: number) => {
                  console.log(`  Part ${partIndex}:`);
                  
                  // textがある場合のみ出力と収集
                  if (part.text) {
                    console.log(`    text: "${part.text}"`);
                    allTextParts.push(part.text);
                  }
                  
                  // inlineDataがある場合のみ出力と収集
                  if (part.inlineData) {
                    console.log(`    inlineData:`);
                    console.log(`      mimeType: ${part.inlineData.mimeType}`);
                    console.log(`      dataLength: ${part.inlineData.data?.length || 0}`);
                    // dataの冒頭50文字のみ出力
                    if (part.inlineData.data) {
                      console.log(`      dataPreview: ${part.inlineData.data.substring(0, 50)}...`);
                      // 画像データを保存
                      if (!imageData) {
                        imageData = {
                          data: part.inlineData.data,
                          mimeType: part.inlineData.mimeType
                        };
                      }
                    }
                  }
                });
              }
            });
          }
          
          // usageMetadataがある場合のみ出力
          if (data.usageMetadata) {
            console.log('--- Usage Metadata ---');
            console.log(`promptTokenCount: ${data.usageMetadata.promptTokenCount || 'undefined'}`);
            console.log(`candidatesTokenCount: ${data.usageMetadata.candidatesTokenCount || 'undefined'}`);
            console.log(`totalTokenCount: ${data.usageMetadata.totalTokenCount || 'undefined'}`);
          }
          
          console.log('=== End Response ===');
        }        

        // 画像データの確認
        if (!imageData) {
          throw new Error('画像データが見つかりませんでした');
        }

        // 画像データをファイルに保存
        const validImageData = imageData as { data: string; mimeType: string };
        const imageBuffer = Buffer.from(validImageData.data, 'base64');
        
        // ファイル名の生成（拡張子はmimeTypeから判定）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = validImageData.mimeType.includes('png') ? 'png' : 'jpg';
        const fileName = `image_${timestamp}.${extension}`;

        // tmpディレクトリに保存
        const outputDir = path.join(process.cwd(), 'tmp', 'images');
        await fs.ensureDir(outputDir);
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, imageBuffer);

        // テキストを結合
        const combinedText = allTextParts.join('').trim();
        
        // 結果を作成
        const result: { imagePath: string; text?: string } = {
          imagePath: `/tmp/images/${fileName}`
        };
        
        if (combinedText) {
          result.text = combinedText;
        }

        console.log('Successfully generated and saved 1 image:', result.imagePath);
        if (combinedText) {
          console.log(`Combined text: ${combinedText.substring(0, 100)}${combinedText.length > 100 ? '...' : ''}`);
        }
        return result;

      } catch (parseError) {
        console.error('Response parsing error:', parseError);
        throw new Error('APIレスポンスの解析に失敗しました: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
      }

    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('画像生成に失敗しました: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * 生成された画像をBase64データURLに変換する
   */
  imageToDataURL(image: GeneratedImage): string {
    return `data:${image.mimeType};base64,${image.data}`;
  }

  /**
   * 生成された画像をBufferに変換する
   */
  imageToBuffer(image: GeneratedImage): Buffer {
    return Buffer.from(image.data, 'base64');
  }
}

// シングルトンインスタンスをエクスポート
export const imageGenerationClient = new ImageGenerationClient();
