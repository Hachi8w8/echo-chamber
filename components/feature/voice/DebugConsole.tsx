"use client"

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
}

interface DebugConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

let logId = 0;
const logs: LogEntry[] = [];
const listeners: ((logs: LogEntry[]) => void)[] = [];

// 元のコンソールメソッドを保存
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

const addLog = (level: LogEntry['level'], ...args: any[]) => {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  const entry: LogEntry = {
    id: ++logId,
    timestamp: new Date().toLocaleTimeString(),
    level,
    message,
  };
  
  logs.push(entry);
  
  // 最新50件のみ保持（パフォーマンス考慮）
  if (logs.length > 50) {
    logs.shift();
  }
  
  // 全リスナーに通知
  listeners.forEach(listener => listener([...logs]));
  
  // 元のコンソールにも出力
  originalConsole[level](...args);
};

// コンソールメソッドをオーバーライド（初回のみ）
if (typeof window !== 'undefined' && !window.__debugConsoleInitialized) {
  console.log = (...args) => addLog('log', ...args);
  console.warn = (...args) => addLog('warn', ...args);
  console.error = (...args) => addLog('error', ...args);
  console.info = (...args) => addLog('info', ...args);
  window.__debugConsoleInitialized = true;
}

export default function DebugConsole({ isOpen, onClose }: DebugConsoleProps) {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([...logs]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateLogs = (newLogs: LogEntry[]) => {
      setLogEntries(newLogs);
    };
    
    listeners.push(updateLogs);
    
    return () => {
      const index = listeners.indexOf(updateLogs);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logEntries]);

  const clearLogs = () => {
    logs.length = 0;
    setLogEntries([]);
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-800';
    }
  };

  const getLevelBg = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'bg-red-50';
      case 'warn': return 'bg-yellow-50';
      case 'info': return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto bg-white border border-gray-300 rounded-lg shadow-lg z-50">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-100 rounded-t-lg">
        <h3 className="font-bold text-gray-800">🔍 デバッグコンソール</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={clearLogs}>
            <Trash2 size={14} />
            クリア
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X size={14} />
            閉じる
          </Button>
        </div>
      </div>

      {/* ログ表示エリア */}
      <div 
        ref={scrollRef}
        className="h-64 overflow-y-auto p-2 font-mono text-xs"
      >
        {logEntries.length === 0 ? (
          <div className="text-gray-500 text-center py-4">ログがありません</div>
        ) : (
          logEntries.map((entry) => (
            <div 
              key={entry.id} 
              className={`mb-1 p-2 rounded ${getLevelBg(entry.level)}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-gray-500 text-xs shrink-0">
                  {entry.timestamp}
                </span>
                <span className={`font-bold text-xs shrink-0 ${getLevelColor(entry.level)}`}>
                  {entry.level.toUpperCase()}
                </span>
              </div>
              <div className={`mt-1 ${getLevelColor(entry.level)} whitespace-pre-wrap break-all`}>
                {entry.message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* フッター */}
      <div className="p-2 border-t bg-gray-50 rounded-b-lg text-xs text-gray-600">
        ログ数: {logEntries.length}/50
      </div>
    </div>
  );
}

declare global {
  interface Window {
    __debugConsoleInitialized?: boolean;
  }
} 