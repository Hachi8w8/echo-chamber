"use client"

import React from "react";

export type ChatPhase = 'waiting' | 'preparing' | 'chatting' | 'ending';

interface TimerDisplayProps {
  chatPhase: ChatPhase;
  secondsLeft: number;
}

// 秒数を mm:ss へ変換
function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * タイマー表示専用のプレゼンテーションコンポーネント。
 * 非常に単純だが分離しておくことでデザイン調整を容易にする。
 */
export default function TimerDisplay({ chatPhase, secondsLeft }: TimerDisplayProps) {
  let text: string;
  if (chatPhase === 'chatting') {
    text = formatTime(secondsLeft);
  } else if (chatPhase === 'ending') {
    text = '00:00';
  } else if (chatPhase === 'preparing') {
    text = '準備中...';
  } else {
    text = '01:00';
  }

  return (
    <div className="w-full flex justify-center mt-2 mb-2">
      <div className="text-2xl font-bold text-gray-700 tracking-widest">
        {text}
      </div>
    </div>
  );
} 