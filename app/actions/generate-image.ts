'use server'

import { imageGenerationClient } from '../../lib/vertex-ai/image';
import { AppConfig } from '../../lib/app-config';
import { generateImagePromptTemplate } from './prompts/generate-image-prompt';

/**
 * 画像生成レスポンスの型定義
 */
export type GenerateImageResponse = {
  imageDataUrl: string;
  text?: string;
};

/**
 * 画像を生成するServer Action
 * @param worldviewDescription [必須] 世界観の説明
 * @returns 画像のデータURLとテキスト（存在する場合）
 */
export async function generateImage(
  worldviewDescription: string
): Promise<GenerateImageResponse | { error: string }> {
  try {
    // プロンプトの検証
    if (!worldviewDescription || worldviewDescription.trim().length === 0) {
      return { error: '【画像生成】世界観の説明を入力してください' };
    }

    // プロンプトテンプレートに世界観の説明を埋め込み
    const prompt = generateImagePromptTemplate.replace(/\{worldviewDescription\}/g, worldviewDescription);
    
    console.log(`【画像生成】INPUT: 世界観="${worldviewDescription}"`);
    console.log(`【画像生成】プロンプト: ${prompt}`);

    let imageDataUrl: string;
    let text: string | undefined;
      if (AppConfig.AI_STUB_MODE.IMAGE) {
      console.log('【画像生成】スタブモード: サンプル画像を使用');
      // スタブモードではサンプル画像のパスを返す
      imageDataUrl = '/api/images/sample1.jpg';
      text = undefined; // スタブモードではテキストは返さない
    } else {
      // Image Generation APIを呼び出し
      const result = await imageGenerationClient.generateImage(prompt, {
        temperature: 1,
        maxOutputTokens: 8192,
        topP: 1,
        includeSafetySettings: true
      });
      
      // パスからファイル名を抽出し、APIルートのパスを生成
      const filename = result.imagePath.split('/').pop();
      imageDataUrl = `/api/images/${filename}`;
      text = result.text; // テキストがある場合は取得 
    }
       
    console.log(`【画像生成】OUTPUT: 画像生成完了, imageDataUrl: ${imageDataUrl}${text ? `, テキスト: ${text}` : ''}`);

    // レスポンスオブジェクトを作成
    const response: GenerateImageResponse = {
      imageDataUrl,
      ...(text && { text })
    };

    return response;

  } catch (error) {    console.error(`【画像生成】ERROR: ${error instanceof Error ? error.message : '不明なエラー'}`);
    const errorMessage = error instanceof Error
      ? `画像生成中にエラーが発生しました: ${error.message}`
      : '画像生成中に不明なエラーが発生しました';
    return { error: errorMessage };
  }
}
