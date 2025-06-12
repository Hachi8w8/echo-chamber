"use client"

import { useEffect, useRef, useState } from "react";

interface VoiceVisualizerProps {
  isActive: boolean; // 発話中かどうか
  barCount?: number; // 棒の本数（デフォルト10）
}

const MIN_HEIGHT = 8;  // px
const MAX_HEIGHT = 24; // px

export default function VoiceVisualizer({ isActive, barCount = 10 }: VoiceVisualizerProps) {
  const [heights, setHeights] = useState<number[]>(() => Array(barCount).fill(MIN_HEIGHT));
  const rafId = useRef<number | null>(null);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const animate = () => {
      setHeights(prev => {
        if (!isActive) {
          // 全て同じ短さ
          return prev.map(() => MIN_HEIGHT);
        }
        // ランダムな高さ
        return prev.map(() => MIN_HEIGHT + Math.random() * (MAX_HEIGHT - MIN_HEIGHT));
      });
      // 次回呼び出しをランダムディレイで
      const randomDelay = 50 + Math.random() * 100; // 50-150ms
      timeoutId.current = setTimeout(() => {
        rafId.current = requestAnimationFrame(animate);
      }, randomDelay);
    };
    // 開始
    animate();

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [isActive, barCount]);

  return (
    <div className="flex items-end justify-center gap-[2px]" style={{ height: MAX_HEIGHT }}>
      {heights.map((h, idx) => (
        <div
          key={idx}
          style={{
            width: 3,
            height: h,
            background: "#00c851",
            borderRadius: 2,
            transition: "height 0.08s ease-out",
          }}
        />
      ))}
    </div>
  );
} 