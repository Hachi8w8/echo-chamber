'use server'

import { geminiClient } from '../../lib/vertex-ai/gemini';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '../../lib/app-config';

/**
 * ユーザーの価値観の型定義
 */
export type Viewpoint = {
  viewpoint: string;
  resonates: boolean;
};

/**
 * 生成結果の型定義
 */
export type GenerateResultsResponse = {
  keywords: string[];
  perspective: string;
};

/**
 * テーマとユーザー価値観に基づいてキーワードと価値観の説明文を生成するServer Action
 * @param theme [必須] 選択されたテーマ
 * @param viewpoints [必須] ユーザーが共感するかしないかの価値観リスト
 * @param temperature [任意] テキスト生成の温度（0.0～2.0）、デフォルト: 1.0
 * @returns キーワードリストと価値観の説明文
 */
export async function generateResultsText(
  theme: string,
  viewpoints: Viewpoint[],
  temperature: number = 1.0
): Promise<GenerateResultsResponse | { error: string }> {
  try {
    // 入力の検証
    if (!theme || theme.trim().length === 0) {
      return { error: '【結果生成】テーマを選択してください' };
    }

    if (!viewpoints || viewpoints.length === 0) {
      return { error: '【結果生成】価値観を指定してください' };
    }

    console.log(`【結果生成】INPUT: テーマ="${theme}", 価値観=${JSON.stringify(viewpoints)}`);

    // プロンプトの読み込みと変数置換
    const promptPath = path.join(process.cwd(), 'app', 'actions', 'prompts', 'generate-results-prompt.txt');
    const promptTemplate = fs.readFileSync(promptPath, 'utf8');
    const prompt = promptTemplate
      .replace(/\{theme\}/g, theme)
      .replace(/\{viewpoints\}/g, JSON.stringify(viewpoints, null, 2));
    console.log('【結果生成】生成用プロンプト:', prompt);

    let responseText;    
    if (AppConfig.AI_STUB_MODE.RESULTS) {
      console.log('スタブモード: 固定レスポンスを使用');
      responseText = JSON.stringify({
        keywords: [
          "個性尊重",
          "機会平等",
          "自律学習",
          "多様性",
          "自己肯定",
          "教育格差",
          "知識探求",
          "未来志向",
          "社会変革",
          "人間性",
          "価値観",
          "教養",
          "本質",
          "主体性"
        ],
        perspective: "教育は、未来を拓く希望。個性を尊重し、自ら学び、多様な価値観を育む場所だと信じてるんだね！"
      });
    } else {
      // Gemini APIを呼び出してテキスト生成
      responseText = await geminiClient.generateText(prompt, temperature);
    }

    console.log(`【結果生成】OUTPUT: 生成テキスト: ${responseText}`);

    let parsedResponse;
    try {
      // 応答テキストをJSONとしてパース
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`【結果生成】JSONパースエラー: ${parseError}`);
      return { error: '生成テキストの解析に失敗しました' };
    }

    // チェック処理
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      console.error(`【結果生成】不正な形式: ${JSON.stringify(parsedResponse)}`);
      return { error: '結果生成の形式が不正です' };
    }

    if (!Array.isArray(parsedResponse.keywords) || !parsedResponse.perspective) {
      console.error(`【結果生成】必須フィールドがありません: ${JSON.stringify(parsedResponse)}`);
      return { error: '結果生成に必須フィールドがありません' };
    }

    console.log(`【結果生成】テキスト生成完了`);
    return parsedResponse;

  } catch (error) {
    console.error(`【結果生成】エラー発生: ${error}`);
    const errorMessage = error instanceof Error 
      ? `結果生成中にエラーが発生しました: ${error.message}` 
      : '結果生成中に不明なエラーが発生しました';
    return { error: errorMessage };
  }
}