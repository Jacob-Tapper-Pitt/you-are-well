"use client"

import { useState, useTransition } from "react"
import { checkUrlSafety } from "./actions"
import ReactMarkdown from "react-markdown"

export default function Home() {
  const [url, setUrl] = useState("")
  const [result, setResult] = useState<{
    success: boolean
    summary?: string
    error?: string
    checkedUrl?: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    startTransition(async () => {
      const data = await checkUrlSafety(url)
      setResult(data)
    })
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-2 text-4xl font-bold">URL Safety Checker</h1>
      <p className="mb-8 text-gray-600">
        Check if a website is safe using multiple security scanners
      </p>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            disabled={isPending}
            className="grow rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isPending || !url}
            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isPending ? "Checking..." : "Check URL"}
          </button>
        </div>
      </form>

      {isPending && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-blue-900">
              Analyzing URL across multiple safety checkers...
            </p>
          </div>
        </div>
      )}

      {result && !isPending && (
        <>
          {result.success && result.summary ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-2xl font-bold">Safety Report</h2>
                {result.checkedUrl && (
                  <span className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-600">
                    {result.checkedUrl}
                  </span>
                )}
              </div>
              <div className="prose max-w-none">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="mb-2 font-semibold text-red-900">Error</h3>
              <p className="text-red-800">
                {result.error || "Failed to check URL"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
