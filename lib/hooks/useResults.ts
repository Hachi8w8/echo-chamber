import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type ResultData = {
  keywords: string[]
  perspective: string
  videoUrl: string
  imageUrl: string
  voiceName: string
  gender: string
}

type Results = {
  user: ResultData | null
  opposite: ResultData | null
}

const fetchResults = async (): Promise<Results> => {
  try {
    const stored = localStorage.getItem("results")
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        user: parsed.user || null,
        opposite: parsed.opposite || null,
      }
    }
    return { user: null, opposite: null }
  } catch (error) {
    console.error("結果データ取得エラー:", error)
    return { user: null, opposite: null }
  }
}

export function useResults() {
  const router = useRouter()
  const [data, setData] = useState<Results | null>(null)

  useEffect(() => {
    const load = async () => {
      const results = await fetchResults()
      setData(results)

      if (!results.user || !results.opposite) {
        router.push("/perspective")
      }
    }
    load()
  }, [router])

  return { data }
}
