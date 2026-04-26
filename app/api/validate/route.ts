import { generateText, Output } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { ideaId, title, description, targetAudience, budget, region } = body

  if (!ideaId || !title || !description) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Mark idea as processing
  await supabase
    .from('ideas')
    .update({ status: 'processing' })
    .eq('id', ideaId)
    .eq('user_id', user.id)

  const { sector } = body

  const systemPrompt = `You are an expert startup co-founder and analyst with deep expertise in Pakistan's startup ecosystem, local market conditions, financial modeling, and business strategy. You have extensive knowledge of Pakistani cities (Karachi, Lahore, Islamabad, Peshawar, Quetta, Faisalabad, Multan, etc.), local consumer behavior, Pakistani regulations, tax environment, SECP requirements, SBP fintech regulations, and the local competitive landscape. You provide rigorous, data-driven analysis of startup ideas for the Pakistani market. Use Pakistani Rupee (PKR) for financial estimates. Be specific and actionable. Reference real Pakistani companies, platforms, and market data where possible (e.g., Daraz, Bykea, Careem, EasyPaisa, JazzCash, Airlift). Do not be overly optimistic — flag real risks specific to Pakistan (load shedding, internet penetration, cash economy, trust issues, regulatory uncertainty).`

  const userPrompt = `Analyze this startup idea for the Pakistani market and return a comprehensive validation report.

Startup Idea: ${title}
Description: ${description}
Target Audience: ${targetAudience || 'Pakistani consumers/businesses'}
Budget: ${budget || 'Not specified'}
Target City/Region: ${region || 'Pakistan'}
Industry Sector: ${sector || 'Not specified'}

Provide a detailed analysis specifically for Pakistan — reference local competitors, Pakistani market size data, PKR-denominated financials, and Pakistan-specific go-to-market strategies. Cover all required fields.`

  const ResultSchema = z.object({
    overallScore: z.number().nullable().describe('Overall viability score from 0-100'),
    verdict: z.string().nullable().describe('One-sentence verdict on the idea (e.g. "Promising niche with strong timing")'),
    summary: z.string().nullable().describe('2-3 paragraph executive summary of the idea and its potential'),
    marketResearch: z.object({
      marketSize: z.string().nullable().describe('Estimated total addressable market size (TAM) with source reference'),
      growthRate: z.string().nullable().describe('Annual market growth rate percentage'),
      competitors: z.array(z.object({
        name: z.string().nullable(),
        description: z.string().nullable(),
        weakness: z.string().nullable(),
      })).nullable().describe('Top 3-5 competitors with their key weaknesses'),
      targetSegment: z.string().nullable().describe('Specific target customer segment description'),
      demandSignals: z.string().nullable().describe('Evidence of real demand: search trends, Reddit threads, existing solutions'),
      score: z.number().nullable().describe('Market opportunity score 0-100'),
    }),
    financials: z.object({
      revenueModel: z.string().nullable().describe('Recommended revenue model (SaaS, marketplace, etc.)'),
      estimatedMRR: z.string().nullable().describe('Realistic MRR estimate at 12 months with assumptions'),
      customerAcquisitionCost: z.string().nullable().describe('Estimated CAC in dollars'),
      lifetimeValue: z.string().nullable().describe('Estimated LTV in dollars'),
      breakEvenTimeline: z.string().nullable().describe('Realistic time to break even'),
      fundingRequired: z.string().nullable().describe('Estimated seed funding needed to reach product-market fit'),
      score: z.number().nullable().describe('Financial viability score 0-100'),
    }),
    strategy: z.object({
      mvpFeatures: z.array(z.string().nullable()).nullable().describe('Top 5 MVP features to build first'),
      gtmStrategy: z.string().nullable().describe('Go-to-market strategy: first 90 days action plan'),
      moat: z.string().nullable().describe('Defensible competitive moat or unique advantage'),
      keyRisks: z.array(z.object({
        risk: z.string().nullable(),
        mitigation: z.string().nullable(),
      })).nullable().describe('Top 3-4 key risks with mitigation strategies'),
      score: z.number().nullable().describe('Strategic execution score 0-100'),
    }),
    coFounderTake: z.string().nullable().describe('Honest co-founder perspective: what excites you, what worries you, the #1 thing to validate first'),
  })

  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })

    const { experimental_output: result } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: systemPrompt,
      prompt: userPrompt,
      experimental_output: Output.object({ schema: ResultSchema }),
    })

    // Save results to Supabase
    await supabase
      .from('ideas')
      .update({ status: 'complete', result })
      .eq('id', ideaId)
      .eq('user_id', user.id)

    return Response.json({ success: true, result })
  } catch (err) {
    console.error('[validate] AI error:', err)
    await supabase
      .from('ideas')
      .update({ status: 'error' })
      .eq('id', ideaId)
      .eq('user_id', user.id)
    return Response.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}
