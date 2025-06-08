"use client"

import { useState, useEffect } from "react"

interface VideoPlayerProps {
  videoUrl: string
  theme?: "light" | "dark"
  allowDownload?: boolean
}

export default function VideoPlayer({ videoUrl, theme = "light", allowDownload = false }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // テーマに応じたスタイル
  const spinnerColor = theme === "light" ? "border-white" : "border-[#00c896]"

  return (
    <div className="relative w-full aspect-video bg-black">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-12 h-12 border-4 ${spinnerColor} border-t-transparent rounded-full animate-spin`}></div>
        </div>
      ) : (
        <>
          {videoUrl && (
            <video
              src={videoUrl}
              controls
              controlsList={allowDownload ? "" : "nodownload"}
              className={`w-full h-full object-contain ${theme === "light" ? "video-light-theme" : "video-dark-theme"}`}
              style={{ display: isLoading ? "none" : "block" }}
            >
              お使いのブラウザは動画の再生に対応していません。
            </video>
          )}
        </>
      )}
    </div>
  )
}
