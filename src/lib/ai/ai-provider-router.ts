import OpenAI from 'openai'

interface AiGenerateOptions {
  systemPrompt: string
  userPrompt: string
}

/**
 * Resilient multi-provider Praz-AI engine router.
 * Automatically tries Groq, Gemini, and OpenAI with seamless fallbacks
 * if a provider is out of credits (429) or unavailable.
 */
export async function generateStructuredJson<T = any>(options: AiGenerateOptions): Promise<T> {
  const errors: string[] = []

  // 1. Try Groq API (Ultra-fast, Llama 3.3 70B Versatile)
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    try {
      console.log('🤖 [Praz-AI Router] Executing via Groq API (llama-3.3-70b-versatile)...')
      const groq = new OpenAI({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
      })
      
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          { 
            role: 'system', 
            content: `${options.systemPrompt}\n\nCRITICAL REQUIREMENT: Output strictly a valid, raw JSON object matching the requested schema. Do not include markdown code block wrappers.` 
          },
          { role: 'user', content: options.userPrompt }
        ]
      })

      const content = completion.choices[0]?.message?.content
      if (content) {
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim()
        console.log('✅ [Praz-AI Router] Successfully generated output via Groq API')
        return JSON.parse(cleanContent) as T
      }
    } catch (err: any) {
      console.warn('⚠️ [Praz-AI Router] Groq API failed, attempting fallback:', err?.message || err)
      errors.push(`Groq (${err?.message || err})`)
    }
  }

  // 2. Try Google Gemini API (Gemini 1.5 Flash / 2.0 Flash)
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (geminiKey) {
    try {
      console.log('🤖 [Praz-AI Router] Executing via Google Gemini API...')
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${options.systemPrompt}\n\nUser Input: ${options.userPrompt}\n\nIMPORTANT: Output strictly raw JSON.` }]
            }
          ],
          generationConfig: { responseMimeType: 'application/json' }
        })
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
          console.log('✅ [Praz-AI Router] Successfully generated output via Google Gemini API')
          return JSON.parse(cleanText) as T
        }
      } else {
        const errText = await res.text()
        console.warn(`⚠️ [Praz-AI Router] Gemini API returned status ${res.status}:`, errText)
        errors.push(`Gemini HTTP ${res.status}`)
      }
    } catch (err: any) {
      console.warn('⚠️ [Praz-AI Router] Gemini API failed, attempting fallback:', err?.message || err)
      errors.push(`Gemini (${err?.message || err})`)
    }
  }

  // 3. Try OpenAI API (ChatGPT)
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      console.log('🤖 [Praz-AI Router] Executing via OpenAI API...')
      const openai = new OpenAI({ apiKey: openaiKey })
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `${options.systemPrompt}\nRespond strictly with a valid JSON object.` },
          { role: 'user', content: options.userPrompt }
        ],
        response_format: { type: 'json_object' }
      })

      const content = completion.choices[0]?.message?.content
      if (content) {
        console.log('✅ [Praz-AI Router] Successfully generated output via OpenAI API')
        return JSON.parse(content) as T
      }
    } catch (err: any) {
      console.warn('⚠️ [Praz-AI Router] OpenAI API failed:', err?.message || err)
      errors.push(`OpenAI (${err?.message || err})`)
    }
  }

  throw new Error(`Praz-AI Generation failed across all configured providers. System logs: ${errors.join(' | ')}`)
}

export async function generateTextOutput(options: AiGenerateOptions): Promise<string> {
  const errors: string[] = []

  // 1. Try Groq API
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    try {
      const groq = new OpenAI({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
      })
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt }
        ]
      })
      const content = completion.choices[0]?.message?.content
      if (content) return content.trim()
    } catch (err: any) {
      errors.push(`Groq (${err?.message || err})`)
    }
  }

  // 2. Try Google Gemini API
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${options.systemPrompt}\n\nUser Input:\n${options.userPrompt}` }]
            }
          ]
        })
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return text.trim()
      }
    } catch (err: any) {
      errors.push(`Gemini (${err?.message || err})`)
    }
  }

  // 3. Try OpenAI API
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey })
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: options.userPrompt }
        ]
      })
      const content = completion.choices[0]?.message?.content
      if (content) return content.trim()
    } catch (err: any) {
      errors.push(`OpenAI (${err?.message || err})`)
    }
  }

  throw new Error(`Text generation failed across providers: ${errors.join(' | ')}`)
}
