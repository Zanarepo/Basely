'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UserPersona, EffectiveMode } from '@/lib/persona/types'
import { PERSONA_STORAGE_KEY, PERSONA_CHANGE_EVENT, PERSONA_CONFIGS } from '@/lib/persona/constants'

export type { UserPersona, EffectiveMode }

export function useUserPersona(workspaceOwnerPersona?: UserPersona | null) {
  const [persona, setPersonaState] = useState<UserPersona | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load persona from localStorage
  const loadPersona = useCallback(() => {
    try {
      const saved = localStorage.getItem(PERSONA_STORAGE_KEY) as UserPersona | null
      if (saved && ['product_manager', 'project_manager', 'agile_member'].includes(saved)) {
        setPersonaState(saved)
      } else {
        setPersonaState(null)
      }
    } catch {
      setPersonaState(null)
    }
  }, [])

  useEffect(() => {
    loadPersona()
    setMounted(true)

    const handleStorage = (e: StorageEvent) => {
      if (e.key === PERSONA_STORAGE_KEY) loadPersona()
    }
    const handleCustomEvent = () => loadPersona()

    window.addEventListener('storage', handleStorage)
    window.addEventListener(PERSONA_CHANGE_EVENT, handleCustomEvent)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(PERSONA_CHANGE_EVENT, handleCustomEvent)
    }
  }, [loadPersona])

  // Update persona
  const setPersona = (newPersona: UserPersona) => {
    try {
      localStorage.setItem(PERSONA_STORAGE_KEY, newPersona)
      setPersonaState(newPersona)
      window.dispatchEvent(new Event(PERSONA_CHANGE_EVENT))
    } catch (err) {
      console.error('Error saving user persona:', err)
    }
  }

  // Determine active persona: explicit user selection takes priority over inherited workspace owner persona
  const activePersona: UserPersona = persona || workspaceOwnerPersona || 'product_manager'
  const config = PERSONA_CONFIGS[activePersona] || PERSONA_CONFIGS.product_manager

  return {
    persona: activePersona,
    hasExplicitPersona: !!persona,
    effectiveMode: config.effectiveMode,
    isProductMode: config.effectiveMode === 'product',
    isProjectMode: config.effectiveMode === 'project',
    addButtonText: config.addButtonText,
    rootNodeLabel: config.rootNodeLabel,
    treeTitleLabel: config.treeTitleLabel,
    showBudgetControls: config.showBudgetControls,
    setPersona,
    mounted,
  }
}
