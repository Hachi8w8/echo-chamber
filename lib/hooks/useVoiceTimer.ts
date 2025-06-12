import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useVoiceTimer
 * 60 秒など一定時間のカウントダウンを行うフック。
 * UI と独立しており、音声認識ロジックに影響を与えない。
 *
 * @param initialSeconds 始値（例: 60）
 * @returns secondsLeft, start, stop, reset
 */
export function useVoiceTimer(initialSeconds: number = 60) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 開始（コールバックはタイムアップ時に呼ばれる）
  const start = useCallback(
    (onTimeUp?: () => void) => {
      // 既存タイマーがあればクリア
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsLeft(initialSeconds);

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [initialSeconds]
  );

  // 強制停止
  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 秒数だけリセット（interval は維持しない）
  const reset = useCallback(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { secondsLeft, start, stop, reset };
} 