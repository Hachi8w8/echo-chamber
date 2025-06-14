// app/actions/generate-perspective.ts
'use server';
import { generateMoviePrompt } from './generate-movie-prompt-text';
import { generateMovie } from './generate-movie';
import { generateResultsText } from './generate-results-text';
import type { SwipeAnswer } from '@/lib/hooks/useCardSwipe';
import { generateImage } from './generate-image';

type GeneratePerspectiveResponse = {
  user: {
    keywords: string[];
    perspective: string;
    videoUrl: string;
    imageUrl: string;
    gender: 'female' | 'male';
    text?: string
    voiceName?: string;
  };
  opposite: {
    keywords: string[];
    perspective: string;
    videoUrl: string;
    imageUrl: string;
    gender: 'female' | 'male';
    text?: string
    voiceName?: string;
  };
};

export async function generatePerspective(
  theme: string,
  answers: SwipeAnswer[]
): Promise<GeneratePerspectiveResponse | { error: string }> {
  try {
    // 反対の回答を作成
    const oppositeAnswers = answers.map((a) => ({ ...a, resonates: !a.resonates }));

    // 映画生成と画像生成プロセスの定義
    const generateMediaProcess = async (answers: SwipeAnswer[]) => {
      // 映画生成と画像生成のプロンプトを取得
      const promptResult = await generateMoviePrompt(theme, answers);

      if ('error' in promptResult) {
        throw new Error(promptResult.error);
      }

      // 同じプロンプトで動画と画像を並列生成
      const [videoResult, imageResult] = await Promise.all([
        generateMovie(promptResult.movieGenerationPrompt),
        generateImage(promptResult.movieGenerationPrompt),
      ]);

      if ('error' in videoResult) {
        throw new Error(videoResult.error);
      }

      if ('error' in imageResult) {
        throw new Error(imageResult.error);
      }

      return {
        videoUrl: videoResult.videoPath,
        imageUrl: imageResult.imageDataUrl,
        gender: imageResult.gender,
        text: imageResult.text,
        voiceName: imageResult.voiceName,
      };
    };

    // すべての処理を並列化
    const [userMediaResult, oppositeMediaResult, userKeywordsResult, oppositeKeywordsResult] = await Promise.all([
      generateMediaProcess(answers),
      generateMediaProcess(oppositeAnswers),
      generateResultsText(theme, answers),
      generateResultsText(theme, oppositeAnswers),
    ]);

    // エラーチェック（キーワード結果）
    if ('error' in userKeywordsResult) {
      throw new Error(userKeywordsResult.error);
    }
    if ('error' in oppositeKeywordsResult) {
      throw new Error(oppositeKeywordsResult.error);
    }

    // 結果を返す
    return {
      user: {
        keywords: userKeywordsResult.keywords,
        perspective: userKeywordsResult.perspective,
        videoUrl: userMediaResult.videoUrl,
        imageUrl: userMediaResult.imageUrl,
        gender: userMediaResult.gender,
        text: userMediaResult.text,
        voiceName: userMediaResult.voiceName,
      },
      opposite: {
        keywords: oppositeKeywordsResult.keywords,
        perspective: oppositeKeywordsResult.perspective,
        videoUrl: oppositeMediaResult.videoUrl,
        imageUrl: oppositeMediaResult.imageUrl,
        gender: oppositeMediaResult.gender,
        text: oppositeMediaResult.text,
        voiceName: oppositeMediaResult.voiceName,
      },
    };
  } catch (error) {
    console.error(`【視点生成】エラー発生: ${error}`);
    return {
      error:
        error instanceof Error
          ? `視点生成中にエラーが発生しました: ${error.message}`
          : '視点生成中に不明なエラーが発生しました',
    };
  }
}
