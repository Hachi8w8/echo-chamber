"use client"

import { Mic } from "lucide-react";
import React from "react";

export type ChatPhase = 'waiting' | 'preparing' | 'chatting' | 'ending';

interface MicButtonProps {
  chatPhase: ChatPhase;
  showEndButton: boolean;
  onStart: () => void;
  onEnd: () => void;
}

/**
 * マイクの開始/停止ボタンを表示するプレゼンテーションコンポーネント。
 * ボタンクリック時のコールバックを受け取り、状態は props で制御。
 */
export default function MicButton({ chatPhase, showEndButton, onStart, onEnd }: MicButtonProps) {
  // クリック時のハンドラを決定
  const handleClick = () => {
    if (chatPhase === 'waiting' || chatPhase === 'ending') {
      onStart();
    } else if (showEndButton) {
      onEnd();
    }
  };

  const disabled = chatPhase === 'preparing' || (chatPhase === 'chatting' && !showEndButton);

  return (
    <div className="w-full flex flex-col items-center mb-6">
      <div style={{ marginTop: 32 }} />
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`flex items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
          chatPhase === 'preparing'
            ? 'bg-yellow-500 opacity-80 cursor-wait'
            : chatPhase === 'chatting' && !showEndButton
            ? 'bg-gray-300 opacity-60 cursor-not-allowed'
            : 'bg-red-500 hover:scale-105'
        }`}
        style={{ width: 60, height: 60 }}
      >
        {chatPhase === 'preparing' ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        ) : chatPhase === 'chatting' ? (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <Mic size={40} color="#fff" />
        )}
      </button>
      <div className="mt-2 text-sm text-gray-500 text-center">
        {chatPhase === 'preparing'
          ? 'マイクに接続中...'
          : chatPhase === 'waiting' || chatPhase === 'ending'
          ? 'タップで開始'
          : showEndButton
          ? 'タップで終了'
          : '1分経過後に停止できます'}
      </div>
    </div>
  );
} 