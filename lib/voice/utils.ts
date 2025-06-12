export type GetAudioContextOptions = AudioContextOptions & {
  id?: string;
};

const map: Map<string, AudioContext> = new Map();

export const audioContext: (
  options?: GetAudioContextOptions
) => Promise<AudioContext> = (() => {
  if (typeof window === 'undefined') {
    // サーバーサイドでは何も返さない
    return async () => {
      throw new Error('AudioContext is not available on server side');
    };
  }

  return async (options?: GetAudioContextOptions) => {
    console.log('[audioContext] 開始', options);
    
    // キャッシュされたコンテキストがあるかチェック
    if (options?.id && map.has(options.id)) {
      const ctx = map.get(options.id);
      if (ctx) {
        console.log('[audioContext] キャッシュから返却', ctx.state);
        return ctx;
      }
    }

    try {
      console.log('[audioContext] AudioContext直接作成を試行');
      const ctx = new AudioContext(options);
      console.log('[audioContext] AudioContext作成成功', {
        state: ctx.state,
        sampleRate: ctx.sampleRate
      });
      
      // AudioContextがsuspendされている場合の処理
      if (ctx.state === 'suspended') {
        console.log('[audioContext] AudioContextがsuspended、resume試行');
        try {
          await ctx.resume();
          console.log('[audioContext] resume成功');
        } catch (resumeError) {
          console.warn('[audioContext] resume失敗、ユーザーインタラクション後に再試行が必要:', resumeError);
          // resumeが失敗してもcontextは返す（後でresumeできる）
        }
      }
      
      if (options?.id) {
        map.set(options.id, ctx);
      }
      
      return ctx;
      
    } catch (e) {
      console.error('[audioContext] AudioContext作成失敗:', e);
      
      // フォールバック: ユーザーインタラクション待ち
      console.log('[audioContext] ユーザーインタラクション待ちフォールバック');
      
      // 毎回新しいPromiseを作成（重要: 古いPromiseが解決済みでも新しく作る）
      const didInteract = new Promise<void>((resolve) => {
        console.log('[audioContext] インタラクションリスナー設定');
        
        const handleInteraction = () => {
          console.log('[audioContext] インタラクション検知');
          resolve();
        };
        
        // 複数のイベントをリッスン
        window.addEventListener("pointerdown", handleInteraction, { once: true });
        window.addEventListener("keydown", handleInteraction, { once: true });
        window.addEventListener("touchstart", handleInteraction, { once: true });
        window.addEventListener("click", handleInteraction, { once: true });
        
        // すでにインタラクションが発生している可能性があるので、即座に解決
        setTimeout(() => {
          console.log('[audioContext] タイムアウト解決（既にインタラクション済みと仮定）');
          resolve();
        }, 100);
      });
      
      await didInteract;
      console.log('[audioContext] インタラクション完了、AudioContext再作成');
      
      // 再度AudioContext作成を試行
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) {
          console.log('[audioContext] インタラクション後キャッシュから返却');
          return ctx;
        }
      }
      
      const ctx = new AudioContext(options);
      console.log('[audioContext] インタラクション後AudioContext作成成功', {
        state: ctx.state,
        sampleRate: ctx.sampleRate
      });
      
      if (options?.id) {
        map.set(options.id, ctx);
      }
      
      return ctx;
    }
  };
})();

export function base64ToArrayBuffer(base64: string) {
  if (typeof window === 'undefined') {
    throw new Error('base64ToArrayBuffer is not available on server side');
  }
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
} 