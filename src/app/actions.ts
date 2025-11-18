"use server"

import { anthropic } from "@/lib/anthropic"
import * as cheerio from "cheerio"

export async function checkUrlSafety(url: string) {
  try {
    // Validate URL
    new URL(url)

    const domain = new URL(url).hostname

    const checkers = [
      `https://www.urlvoid.com/scan/${domain}`,
      `https://sitecheck.sucuri.net/results/${url}`,
      `https://www.isitphishing.org/check/${encodeURIComponent(url)}`,
      `https://www.scamvoid.net/check/${domain}`,
    ]

    // Fetch all checker pages in parallel
    const fetchResults = await Promise.allSettled(
      checkers.map(async (checkerUrl) => {
        const response = await fetch(checkerUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        })

        const html = await response.text()

        // Extract text from HTML
        const $ = cheerio.load(html)
        // Remove script and style tags
        $("script, style, noscript").remove()
        // Get text content
        const text = $("body").text().trim().replace(/\s+/g, " ")

        return { url: checkerUrl, text: text.slice(0, 10000) }
      }),
    )

    // Collect successful fetches
    const successfulFetches = fetchResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)

    if (successfulFetches.length === 0) {
      throw new Error("Failed to fetch any safety checker websites")
    }

    // Build prompt with all fetched data
    const prompt = `I need you to analyze the safety of this URL: ${url}

I've fetched the results from ${successfulFetches.length} different website safety checkers. Here's the extracted text from each:

${successfulFetches
  .map(
    (fetch, i) => `
=== Checker ${i + 1}: ${fetch.url} ===
${fetch.text}
`,
  )
  .join("\n\n")}

Please analyze all of these results and provide:
1. A clear safety verdict (SAFE, SUSPICIOUS, or DANGEROUS)
2. A brief summary of findings
3. Key concerns if any were found
4. Which checkers flagged issues (if any)

Format your response clearly for a non-technical user.`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    })

    const textBlocks = response.content.filter((block) => block.type === "text")
    const summary = textBlocks
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n\n")

    return {
      success: true,
      summary,
      checkedUrl: url,
    }
  } catch (error) {
    console.error("Error checking URL:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to check URL safety",
    }
  }
}
