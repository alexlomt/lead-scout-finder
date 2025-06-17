
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  searchResultId: string
  businessName: string
  website?: string
  address?: string
}

interface ScoreBreakdown {
  websiteQuality: number
  digitalPresence: number
  seo: number
  overall: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { searchResultId, businessName, website, address } = await req.json() as AnalysisRequest

    console.log(`Starting analysis for: ${businessName}`)

    // Update status to analyzing
    await supabaseClient
      .from('search_results')
      .update({ analysis_status: 'analyzing' })
      .eq('id', searchResultId)

    const scores = await analyzeBusinessPresence(businessName, website, address)

    // Update the search result with enhanced scores
    const { error } = await supabaseClient
      .from('search_results')
      .update({
        website_quality_score: scores.websiteQuality,
        digital_presence_score: scores.digitalPresence,
        seo_score: scores.seo,
        overall_score: scores.overall,
        analysis_status: 'complete',
        last_analyzed: new Date().toISOString()
      })
      .eq('id', searchResultId)

    if (error) {
      console.error('Error updating search result:', error)
      throw error
    }

    console.log(`Analysis complete for: ${businessName}, Overall Score: ${scores.overall}`)

    return new Response(
      JSON.stringify({ success: true, scores }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    console.error('Analysis error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      },
    )
  }
})

async function analyzeBusinessPresence(
  businessName: string, 
  website?: string, 
  address?: string
): Promise<ScoreBreakdown> {
  const braveApiKey = Deno.env.get('BRAVE_API_KEY')
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  let websiteQuality = 0
  let digitalPresence = 0
  let seo = 0

  // 1. Digital Presence Analysis using Brave Search
  if (braveApiKey) {
    try {
      digitalPresence = await analyzeBraveSearchPresence(businessName, address, braveApiKey)
    } catch (error) {
      console.error('Brave Search analysis failed:', error)
      digitalPresence = getBasicDigitalPresence(website)
    }
  } else {
    digitalPresence = getBasicDigitalPresence(website)
  }

  // 2. Website Quality Analysis using Firecrawl + OpenAI
  if (website && firecrawlApiKey && openaiApiKey) {
    try {
      const websiteData = await analyzeWebsiteWithFirecrawl(website, firecrawlApiKey)
      const analysis = await analyzeContentWithOpenAI(websiteData, businessName, openaiApiKey)
      websiteQuality = analysis.websiteQuality
      seo = analysis.seo
    } catch (error) {
      console.error('Website analysis failed:', error)
      websiteQuality = getBasicWebsiteScore(website)
      seo = getBasicSEOScore(website)
    }
  } else {
    websiteQuality = getBasicWebsiteScore(website)
    seo = getBasicSEOScore(website)
  }

  const overall = Math.min(websiteQuality + digitalPresence + seo, 100)

  return { websiteQuality, digitalPresence, seo, overall }
}

async function analyzeBraveSearchPresence(
  businessName: string, 
  address?: string, 
  apiKey?: string
): Promise<number> {
  if (!apiKey) return getBasicDigitalPresence()

  const searchQuery = address ? `"${businessName}" "${address}"` : `"${businessName}"`
  
  const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey
    },
    body: new URLSearchParams({
      q: searchQuery,
      count: '10'
    })
  })

  if (!response.ok) {
    throw new Error(`Brave Search API error: ${response.status}`)
  }

  const data = await response.json()
  const results = data.web?.results || []
  
  let score = 5 // Base score
  
  // Look for social media mentions and directory listings
  const socialPlatforms = ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'youtube.com']
  const directoryPlatforms = ['yelp.com', 'google.com/maps', 'yellowpages.com', 'bbb.org']
  
  for (const result of results) {
    const url = result.url?.toLowerCase() || ''
    
    // Social media presence (+3 per platform, max 12)
    for (const platform of socialPlatforms) {
      if (url.includes(platform) && score < 17) {
        score += 3
        break
      }
    }
    
    // Directory listings (+2 per listing, max 8)
    for (const platform of directoryPlatforms) {
      if (url.includes(platform) && score < 25) {
        score += 2
        break
      }
    }
  }
  
  // Additional points for number of results
  if (results.length >= 5) score += 3
  if (results.length >= 10) score += 2
  
  return Math.min(score, 30)
}

async function analyzeWebsiteWithFirecrawl(website: string, apiKey: string) {
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: website,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      includeTags: ['title', 'meta', 'h1', 'h2', 'h3'],
      timeout: 10000
    })
  })

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.status}`)
  }

  return await response.json()
}

async function analyzeContentWithOpenAI(
  websiteData: any, 
  businessName: string, 
  apiKey: string
): Promise<{ websiteQuality: number; seo: number }> {
  const content = websiteData.data?.markdown || websiteData.data?.html || ''
  const metadata = websiteData.data?.metadata || {}
  
  const prompt = `
Analyze this website for "${businessName}" and provide scores (0-40 for website quality, 0-30 for SEO):

WEBSITE CONTENT:
${content.substring(0, 2000)}

METADATA:
Title: ${metadata.title || 'None'}
Description: ${metadata.description || 'None'}

Score based on:
WEBSITE QUALITY (0-40):
- Professional design and layout (0-10)
- Mobile responsiveness (0-10) 
- Content quality and completeness (0-10)
- User experience and navigation (0-10)

SEO (0-30):
- Title and meta descriptions (0-10)
- Header structure and content (0-10)
- Overall SEO optimization (0-10)

Respond with only a JSON object: {"websiteQuality": number, "seo": number}
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.1
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content_response = data.choices[0]?.message?.content || '{}'
  
  try {
    return JSON.parse(content_response)
  } catch {
    // Fallback if JSON parsing fails
    return { websiteQuality: 20, seo: 15 }
  }
}

function getBasicDigitalPresence(website?: string): number {
  return website ? 15 : 5
}

function getBasicWebsiteScore(website?: string): number {
  return website ? 20 : 0
}

function getBasicSEOScore(website?: string): number {
  return website ? 10 : 0
}
