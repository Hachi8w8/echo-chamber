'use server'

import { geminiClient } from '../../lib/vertex-ai/gemini';
import { AppConfig } from '../../lib/app-config';
import { generateMoviePromptTemplate } from './prompts/generate-movie-prompt-prompt';

/**
 * ユーザーの価値観の型定義
 */
export type Viewpoint = {
  viewpoint: string;
  resonates: boolean;
};

/**
 * テーマとユーザー価値観に基づいて動画生成用プロンプトを生成するServer Action
 * @param theme [必須] 選択されたテーマ
 * @param viewpoints [必須] ユーザーが共感するかしないかの価値観リスト
 * @param temperature [任意] テキスト生成の温度（0.0～2.0）、デフォルト: 1.0
* @returns 動画生成用プロンプト
 */
export async function generateMoviePrompt(
  theme: string,
  viewpoints: Viewpoint[],
  temperature: number = 1.0
): Promise<{ movieGenerationPrompt: string } | { error: string }> {
  try {
    // 入力の検証
    if (!theme || theme.trim().length === 0) {
      return { error: '【プロンプト生成】テーマを選択してください' };
    }

    if (!viewpoints || viewpoints.length === 0) {
      return { error: '【プロンプト生成】価値観をを指定してください' };
    }

    console.log(`【プロンプト生成】INPUT: テーマ="${theme}" , 価値観=${JSON.stringify(viewpoints)}`);
      // プロンプトの読み込みと変数置換
    const inpurPrompt = generateMoviePromptTemplate
      .replace(/\{theme\}/g, theme)
      .replace(/\{viewpoints\}/g, JSON.stringify(viewpoints, null, 2));
      console.log('【プロンプト生成】動画を生成するプロンプトを生成するためのプロンプト:', inpurPrompt);

    let responseText;    
    if (AppConfig.AI_STUB_MODE.MOVIE_PROMPT) {
      console.log('スタブモード: 固定レスポンスを使用');
      responseText = JSON.stringify({
        movieGenerationPrompt: `A whimsical 3D world floating in soft pink and lavender skies, with several cozy floating islands connected by glowing heart-shaped bridges. Each island represents a different aspect of family values. One island shows two characters far apart, yet connected by a glowing thread of light between their hearts. Another has a picnic scene where everyone is sitting freely, without fixed seats or roles, enjoying each other's presence. A third island has a giant ear-shaped sculpture surrounded by bubbles with dialogue icons, symbolizing listening and conversation. One area displays a playful, upside-down house with a sign that says \"normal?\"—questioning traditional ideas of family. The whole world is surrounded by floating pillows, blankets, and twinkling stars, creating a warm, relaxed atmosphere. No harsh lines, everything is soft, round, and magical.`
      });
    } else {
      // Gemini APIを呼び出してプロンプト生成
      responseText = await geminiClient.generateText(inpurPrompt, temperature);
    }
    
    console.log(`【プロンプト生成】OUTPUT: 生成テキスト: ${responseText}`);

    let parsedResponse;

    try {
      // 応答テキストをJSONとしてパース
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`【プロンプト生成】JSONパースエラー: ${parseError}`);
      return { error: '生成テキストの解析に失敗しました' };
    }

    // チェック処理
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      console.error(`【プロンプト生成】不正な形式: ${JSON.stringify(parsedResponse)}`);
      return { error: 'プロンプト生成結果の形式が不正です' };
    }

    if (!parsedResponse.movieGenerationPrompt) {
      console.error(`【プロンプト生成】movieGenerationPromptフィールドがありません: ${JSON.stringify(parsedResponse)}`);
      return { error: 'プロンプト生成結果にmovieGenerationPromptフィールドがありません' };
    }
    console.log(`【プロンプト生成】プロンプト生成完了`);

    return parsedResponse;

  } catch (error) {
    console.error(`【プロンプト生成】エラー発生: ${error}`);
    const errorMessage = error instanceof Error 
      ? `プロンプト生成中にエラーが発生しました: ${error.message}` 
      : 'プロンプト生成中に不明なエラーが発生しました';
    return { error: errorMessage };
  }
}
