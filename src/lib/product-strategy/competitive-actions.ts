'use server'

import { createClient } from '@/utils/supabase/server'
import { CompetitorFeature, CompetitorPricingItem, CompetitorStrategyItem } from '@/components/dashboard/product/strategy/competitive/constants/types'
import { CompetitiveMoat } from '@/lib/product-strategy/types'

export async function generateCompetitiveMatrix(
  projectId: string,
  organizationId: string
): Promise<{ 
  success: boolean; 
  error?: string; 
  competitorA?: string; 
  competitorB?: string; 
  features?: CompetitorFeature[];
  pricing?: CompetitorPricingItem[];
  strategy?: CompetitorStrategyItem[];
  moats?: CompetitiveMoat[];
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Unauthorized' }

    // 1. Fetch project and strategy canvas to use as context
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('name, description')
      .eq('id', projectId)
      .eq('organization_id', organizationId)
      .single()

    const { data: strategy } = await supabase
      .from('product_strategies')
      .select('target_market, vision_statement, value_proposition')
      .eq('project_id', projectId)
      .single()

    if (pErr || !project) {
      return { success: false, error: 'Project not found or no context available.' }
    }

    // 2. Determine if AI is configured
    const hasAiKey = Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.OPENAI_API_KEY)
    if (!hasAiKey) {
      return { success: false, error: 'AI features are not configured. Please add an API key.' }
    }

    // 3. Construct prompt
    const prompt = `
      You are an expert Product Manager conducting a competitive analysis for a new product.
      
      Project Context:
      Product Name: ${project.name || 'Unknown'}
      Description: ${project.description || 'N/A'}
      Target Market: ${strategy?.target_market || 'N/A'}
      Vision: ${strategy?.vision_statement || 'N/A'}
      Value Proposition: ${strategy?.value_proposition || 'N/A'}
      
      Tasks:
      1. Identify the top 2 realistic competitors in this market. Name them Competitor A and Competitor B.
      2. Identify 5-7 core feature dimensions or capabilities that matter most to users in this space. For each, score our product vs Competitor A and Competitor B using "leading", "partial", "gap", or "moat" (only our product can have a moat).
      3. Identify 3-4 pricing dimensions (e.g. Pricing Model, Starting Price, Average ACV, Discounting Strategy).
      4. Identify 5-6 market strategy dimensions. You MUST include "Business Model", "Estimated Market Share", and "Annual Revenue (ARR)".
      5. Identify 1-3 competitive moats for OUR PRODUCT (e.g. what makes us defensible).
      
      CRITICAL INSTRUCTION FOR VERIFICATION LINKS:
      Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. They will be broken.
      Instead, whenever you generate a value for "Estimated Market Share" or "Annual Revenue (ARR)", you MUST append a Google Search link that the user can click to instantly verify your claim.
      Format: \`$45M [Verify on Google](https://www.google.com/search?q=Competitor+Name+Annual+Revenue)\` or \`15% [Verify on Google](https://www.google.com/search?q=Competitor+Name+Market+Share)\`.
      Never output a raw number for these metrics without a linked search source.
      
      Return a JSON object with this exact structure:
      {
        "competitorA": "Name of first competitor",
        "competitorB": "Name of second competitor",
        "features": [
          {
            "featureName": "Name of the feature",
            "ourProduct": "leading" | "partial" | "gap" | "moat",
            "competitorA": "leading" | "partial" | "gap",
            "competitorB": "leading" | "partial" | "gap",
            "notes": "Strategic note on this feature"
          }
        ],
        "pricing": [
          {
            "dimensionName": "Name of pricing dimension",
            "ourProduct": "Our value",
            "competitorA": "Competitor A value",
            "competitorB": "Competitor B value"
          }
        ],
        "strategy": [
          {
            "dimensionName": "Name of strategy dimension",
            "ourProduct": "Our value",
            "competitorA": "Competitor A value",
            "competitorB": "Competitor B value"
          }
        ],
        "moats": [
          {
            "category": "technology" | "network_effects" | "brand" | "switching_costs" | "scale" | "other",
            "title": "Short title of the moat",
            "description": "1 sentence describing the moat",
            "strength": "high" | "medium" | "low"
          }
        ]
      }
    `

    console.log(`🤖 [Competitive AI] Generating competitive matrix for ${project.name}`)
    
    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
    
    const systemPrompt = "You are an expert Product Manager conducting a competitive analysis. Always respond with strict, valid JSON matching the requested schema."

    const jsonResult = await generateStructuredJson<{
      competitorA: string;
      competitorB: string;
      features: {
        featureName: string;
        ourProduct: 'leading' | 'partial' | 'gap' | 'moat';
        competitorA: 'leading' | 'partial' | 'gap';
        competitorB: 'leading' | 'partial' | 'gap';
        notes: string;
      }[];
      pricing: {
        dimensionName: string;
        ourProduct: string;
        competitorA: string;
        competitorB: string;
      }[];
      strategy: {
        dimensionName: string;
        ourProduct: string;
        competitorA: string;
        competitorB: string;
      }[];
      moats: {
        category: 'technology' | 'network_effects' | 'brand' | 'switching_costs' | 'scale' | 'other';
        title: string;
        description: string;
        strength: 'high' | 'medium' | 'low';
      }[];
    }>({
      systemPrompt,
      userPrompt: prompt
    })

    if (!jsonResult) {
      return { success: false, error: 'Failed to generate competitive matrix from AI.' }
    }

    // Map to CompetitorFeature type with IDs
    const mappedFeatures: CompetitorFeature[] = (jsonResult.features || []).map((f, i) => ({
      id: `ai_feat_${Date.now()}_${i}`,
      featureName: f.featureName,
      ourProduct: f.ourProduct,
      competitorA: f.competitorA,
      competitorB: f.competitorB,
      notes: f.notes
    }))

    const mappedPricing: CompetitorPricingItem[] = (jsonResult.pricing || []).map((p, i) => ({
      id: `ai_price_${Date.now()}_${i}`,
      dimensionName: p.dimensionName,
      ourProduct: p.ourProduct,
      competitorA: p.competitorA,
      competitorB: p.competitorB
    }))

    const mappedStrategy: CompetitorStrategyItem[] = (jsonResult.strategy || []).map((s, i) => ({
      id: `ai_strat_${Date.now()}_${i}`,
      dimensionName: s.dimensionName,
      ourProduct: s.ourProduct,
      competitorA: s.competitorA,
      competitorB: s.competitorB
    }))

    const mappedMoats: CompetitiveMoat[] = (jsonResult.moats || []).map((m, i) => ({
      id: `ai_moat_${Date.now()}_${i}`,
      category: m.category,
      title: m.title,
      description: m.description,
      strength: m.strength
    }))

    return { 
      success: true, 
      competitorA: jsonResult.competitorA, 
      competitorB: jsonResult.competitorB, 
      features: mappedFeatures,
      pricing: mappedPricing,
      strategy: mappedStrategy,
      moats: mappedMoats
    }

  } catch (error: any) {
    console.error('Error auto-generating competitive matrix:', error)
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}
