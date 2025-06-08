"use client"

import { useEffect, useRef, useState } from "react";

export type LogLevel = 'all' | 'important' | 'errors';

export interface LogPanelProps {
  messages: string[];
}

/*
  LogPanel は音声認識ロジックに依存しない表示専用コンポーネント。
  VoiceChat から配列を受け取り、
   • 展開/折りたたみ
   • レベル別フィルタリング
   • メッセージ末尾への自動スクロール
  のみを担当する。
*/
export default function LogPanel({ messages }: LogPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<LogLevel>('important');
  const logRef = useRef<HTMLDivElement>(null);

  const getFiltered = () => {
    if (filter === 'all') return messages;
    if (filter === 'errors') return messages.filter((m) => m.includes('❌'));
    // important
    return messages.filter((msg) =>
      msg.includes('❌') ||
      msg.includes('✅') ||
      msg.includes('⚠️') ||
      msg.includes('🔄') ||
      msg.includes('Live API') ||
      msg.includes('client.connect') ||
      msg.includes('turncomplete') ||
      msg.includes('WebSocket') ||
      msg.includes('接続') ||
      msg.includes('切断') ||
      msg.includes('送信') ||
      msg.includes('受信')
    );
  };

  // 新しいメッセージ受信時に末尾へスクロール
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const filtered = getFiltered();

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: expanded ? '350px' : '40px',
        background: 'rgba(0,0,0,0.9)',
        color: '#fff',
        fontSize: 11,
        zIndex: 1000,
        transition: 'height 0.3s ease',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.95)',
          borderBottom: '1px solid #333',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span>🔍 ログ ({filtered.length}/{messages.length})</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogLevel)}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '2px 4px',
              fontSize: '10px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="important">重要</option>
            <option value="all">全て</option>
            <option value="errors">エラーのみ</option>
          </select>
          <span>{expanded ? '▼' : '▲'}</span>
        </div>
      </div>

      {/* 本文 */}
      {expanded && (
        <div
          ref={logRef}
          style={{
            height: '302px',
            overflowY: 'auto',
            padding: 8,
          }}
        >
          {filtered.map((msg, i) => (
            <div
              key={i}
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                marginBottom: 2,
                color: msg.includes('❌')
                  ? '#ff6b6b'
                  : msg.includes('⚠️')
                  ? '#ffa726'
                  : msg.includes('✅')
                  ? '#66bb6a'
                  : msg.includes('🔄')
                  ? '#42a5f5'
                  : msg.includes('🎤')
                  ? '#ab47bc'
                  : '#fff',
              }}
            >
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 