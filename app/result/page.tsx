import { Suspense } from "react"
import ResultPageContent from "./ResultPageContent"

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResultPageContent />
    </Suspense>
  )
}
