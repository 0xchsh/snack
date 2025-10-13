import { Link } from '@/types'

/**
 * AI Summary Service - Generates LLM-readable summaries for Snack lists
 * Uses GPT-4o-mini for cost-efficient summarization (~$0.0006 per list)
 */

interface AISummaryResult {
  summary: string
  themes: string[]
  error?: string
}

interface LinkContent {
  url: string
  title: string | null
  description: string | null
}

/**
 * Generate an AI summary of all links in a list
 * Uses existing OG data (title, description) to minimize API costs
 * Processes entire list in single API call for efficiency
 */
export async function generateListSummary(
  listTitle: string,
  links: Link[]
): Promise<AISummaryResult> {
  try {
    // Validate input
    if (!links || links.length === 0) {
      return {
        summary: `A curated collection titled "${listTitle}". This list is currently empty.`,
        themes: [],
      }
    }

    // Extract link content (use existing OG data)
    const linkContents: LinkContent[] = links.map((link) => ({
      url: link.url,
      title: link.title,
      description: link.description,
    }))

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.warn('OpenAI API key not configured. Using fallback summary.')
      return generateFallbackSummary(listTitle, linkContents)
    }

    // Call OpenAI GPT-4o-mini
    const summary = await callOpenAI(apiKey, listTitle, linkContents)

    return summary
  } catch (error) {
    console.error('Error generating AI summary:', error)
    // Return fallback summary on error
    return generateFallbackSummary(listTitle, links.map(l => ({
      url: l.url,
      title: l.title,
      description: l.description,
    })))
  }
}

/**
 * Call OpenAI GPT-4o-mini API to generate summary
 */
async function callOpenAI(
  apiKey: string,
  listTitle: string,
  links: LinkContent[]
): Promise<AISummaryResult> {
  const prompt = createPrompt(listTitle, links)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries of curated link collections. Your summaries should help other AI assistants quickly understand the content and purpose of the collection.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content?.trim()

  if (!content) {
    throw new Error('No content returned from OpenAI')
  }

  // Parse the JSON response
  try {
    const parsed = JSON.parse(content)
    return {
      summary: parsed.summary || content,
      themes: parsed.themes || extractThemesFromText(content),
    }
  } catch {
    // If JSON parsing fails, use the raw content as summary
    return {
      summary: content,
      themes: extractThemesFromText(content),
    }
  }
}

/**
 * Create the prompt for OpenAI
 */
function createPrompt(listTitle: string, links: LinkContent[]): string {
  const linksText = links
    .map((link, index) => {
      const parts = [`${index + 1}. ${link.url}`]
      if (link.title) parts.push(`   Title: ${link.title}`)
      if (link.description) parts.push(`   Description: ${link.description}`)
      return parts.join('\n')
    })
    .join('\n\n')

  return `Please analyze this curated link collection and provide a concise summary that would help another AI assistant understand its content and purpose.

List Title: "${listTitle}"
Number of Links: ${links.length}

Links:
${linksText}

Please respond with a JSON object containing:
1. "summary": A 2-3 sentence summary of what this collection is about, its main themes, and its potential use cases (max 150 words)
2. "themes": An array of 3-5 key themes or topics covered (single words or short phrases)

Example response format:
{
  "summary": "This is a comprehensive collection of web development resources...",
  "themes": ["web development", "tutorials", "JavaScript", "frontend", "tools"]
}

Focus on being informative and concise. The summary will be embedded in page metadata for AI assistants to read.`
}

/**
 * Generate a fallback summary when AI is unavailable
 * Uses simple heuristics based on titles and URLs
 */
function generateFallbackSummary(
  listTitle: string,
  links: LinkContent[]
): AISummaryResult {
  const domains = links.map((link) => {
    try {
      return new URL(link.url).hostname.replace('www.', '')
    } catch {
      return 'unknown'
    }
  })

  const uniqueDomains = [...new Set(domains)].slice(0, 5)

  const summary = `A curated collection titled "${listTitle}" containing ${links.length} link${
    links.length !== 1 ? 's' : ''
  }. This collection includes resources from ${uniqueDomains.join(
    ', '
  )} and other sources.`

  // Extract simple themes from titles and domains
  const allWords = links
    .map((link) => link.title || '')
    .join(' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4) // Filter short words

  const wordFreq: Record<string, number> = {}
  allWords.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })

  const themes = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  return {
    summary,
    themes: themes.length > 0 ? themes : ['curated links', 'resources'],
  }
}

/**
 * Extract themes from text using simple keyword extraction
 */
function extractThemesFromText(text: string): string[] {
  // Simple keyword extraction - look for capitalized words and common topics
  const words = text
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .filter((word) => /^[A-Z]/.test(word)) // Capitalized words often indicate topics

  const uniqueWords = [...new Set(words)].slice(0, 5)
  return uniqueWords.length > 0 ? uniqueWords : ['curated content', 'resources']
}
