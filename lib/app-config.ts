/**
 * アプリケーション全体の設定
 */
export const AppConfig = {
  /**
   * AI機能のスタブモード設定
   * true: テスト用スタブレスポンスを使用
   * false: 本番用 AI APIを使用
   */  
  AI_STUB_MODE: {
    VALUES_TEXT: true,  // 価値観テキスト生成
    MOVIE_PROMPT: true, // ムービープロンプト生成
    MOVIE: true,        // ムービー生成
    RESULTS: true,      // 結果テキスト生成
    IMAGE: true,        // 画像生成
  },
};
