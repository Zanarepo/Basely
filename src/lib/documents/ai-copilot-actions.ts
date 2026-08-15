'use server'

import { generateTextOutput } from '@/lib/ai/ai-provider-router'

export type AiCopilotMode = 'bullets' | 'criteria' | 'summary' | 'polish'

export async function refineSectionTextWithAi(
  text: string,
  mode: AiCopilotMode
): Promise<{ ok: boolean; resultText?: string; error?: string }> {
  try {
    const rawText = text?.trim() || ''

    // If text is empty, provide a helpful starter prompt depending on mode
    if (!rawText) {
      if (mode === 'bullets') {
        return {
          ok: true,
          resultText: `• Core Feature Objective: Define primary system capability.\n• Technical Scope: Outline frontend, backend, and API boundaries.\n• Key Deliverable: Specify launch artifacts and success criteria.`,
        }
      }
      if (mode === 'criteria') {
        return {
          ok: true,
          resultText: `**User Story**:\nAs a Product Manager, I want to define clear feature boundaries so that engineers can build without ambiguity.\n\n**Acceptance Criteria**:\n- [ ] **Scenario 1**: Given valid user input, system processes request in < 200ms.\n- [ ] **Scenario 2**: Given network error, system displays clean error fallback.\n- [ ] **Scenario 3**: Given unauthorized access, system denies execution with 403 error.`,
        }
      }
      if (mode === 'summary') {
        return {
          ok: true,
          resultText: `💡 **EXECUTIVE SUMMARY**:\n• Objective: Deliver scalable enterprise features on target release schedule.\n• Scope: Enforces role-based security, real-time auto-saving, and cross-team alerts.`,
        }
      }
      if (mode === 'polish') {
        return {
          ok: true,
          resultText: `This section defines core functional requirements, system dependencies, and acceptance criteria for implementation.`,
        }
      }
    }

    let systemPrompt = ''
    if (mode === 'bullets') {
      systemPrompt = `You are Praz-AI, an expert Product Management AI. Convert the input product requirements text into a clean, well-structured list of markdown bullet points. Keep it concise, actionable, and executive-ready.`
    } else if (mode === 'criteria') {
      systemPrompt = `You are Praz-AI, an expert Agile Product Manager. Transform the input product specification into formal Agile User Stories and detailed Acceptance Criteria (Given/When/Then scenarios with checkboxes). Maintain crisp technical formatting.`
    } else if (mode === 'summary') {
      systemPrompt = `You are Praz-AI, an executive product strategist. Summarize the document section into a 2-3 line Executive Summary highlighting key objectives, deliverables, and impacts.`
    } else if (mode === 'polish') {
      systemPrompt = `You are Praz-AI, a senior tech writer. Refine and polish the input text. Fix grammar errors, remove wordiness, enhance tone to executive-grade product management prose, and preserve all technical facts.`
    }

    try {
      const aiResult = await generateTextOutput({
        systemPrompt,
        userPrompt: rawText,
      })

      if (aiResult) {
        return { ok: true, resultText: aiResult.trim() }
      }
    } catch (aiRouterErr) {
      console.warn('[Praz-AI Router Fallback]:', aiRouterErr)
    }

    // Smart Rule-based Fallback if AI providers are unreachable
    if (mode === 'bullets') {
      const lines = rawText.split('\n').filter((l) => l.trim().length > 0)
      const bullets = lines.map((l) => (l.startsWith('•') || l.startsWith('-') ? l : `• ${l.trim()}`)).join('\n')
      return { ok: true, resultText: bullets }
    }

    if (mode === 'summary') {
      const lines = rawText.split('\n').filter((l) => l.trim().length > 0)
      const top3 = lines.slice(0, 3).join(' ')
      return { ok: true, resultText: `💡 **EXECUTIVE SUMMARY**:\n${top3}` }
    }

    if (mode === 'criteria') {
      return {
        ok: true,
        resultText: `**User Story**:\n${rawText}\n\n**Acceptance Criteria**:\n- [ ] Scenario 1: Given valid inputs, system executes successfully.\n- [ ] Scenario 2: System logs audit telemetries and dispatches notifications.`,
      }
    }

    // Polish mode fallback
    return {
      ok: true,
      resultText: rawText
        .replace(/\b(wanna|gonna|gottas)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim(),
    }
  } catch (err: any) {
    console.error('[Praz-AI Copilot Error]:', err)
    return { ok: false, error: err.message || 'AI refinement failed.' }
  }
}
