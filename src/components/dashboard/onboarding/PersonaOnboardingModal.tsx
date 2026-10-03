'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Sparkles, ArrowRight, Loader2, Check } from 'lucide-react'
import type { UserPersona } from '@/lib/persona/types'
import { createClient } from '@/utils/supabase/client'

interface RolePreset {
  id: string
  label: string
  emoji: string
  persona: UserPersona
  presetName: string
  actionLabel: string
}

const PREDEFINED_ROLES: RolePreset[] = [
  { id: 'dev', label: 'Software Developer', emoji: '💻', persona: 'product_manager', presetName: 'Agile (Epics & Stories)', actionLabel: '+ Add Epic' },
  { id: 'pm', label: 'Product Manager', emoji: '🎯', persona: 'product_manager', presetName: 'Agile (Roadmap & Epics)', actionLabel: '+ Add Epic' },
  { id: 'pmo', label: 'Project Manager', emoji: '📊', persona: 'project_manager', presetName: 'Traditional WBS (Phases)', actionLabel: '+ Add Phase' },
  { id: 'designer', label: 'UI/UX Designer', emoji: '🎨', persona: 'product_manager', presetName: 'Agile (Epics & Stories)', actionLabel: '+ Add Epic' },
  { id: 'qa', label: 'QA & Tester', emoji: '🧪', persona: 'product_manager', presetName: 'Agile (Epics & Stories)', actionLabel: '+ Add Epic' },
  { id: 'field', label: 'Surveyor / Foreman', emoji: '🏗️', persona: 'project_manager', presetName: 'Traditional (Phases & Site)', actionLabel: '+ Add Phase' },
  { id: 'scrum', label: 'Scrum Master', emoji: '💼', persona: 'product_manager', presetName: 'Agile (Epics & Stories)', actionLabel: '+ Add Epic' },
  { id: 'other', label: 'Other Role', emoji: '✨', persona: 'agile_member', presetName: 'Auto-Inherit Workspace Mode', actionLabel: 'Auto Adaptive' },
]

interface PersonaOnboardingModalProps {
  isOpen?: boolean
  onClose?: () => void
  projectId?: string
  organizationId?: string
}

export function PersonaOnboardingModal({ isOpen: externalIsOpen, onClose, projectId, organizationId }: PersonaOnboardingModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('pm')
  const [customRoleInput, setCustomRoleInput] = useState('')
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupStep, setSetupStep] = useState(0)

  const selectedPreset = PREDEFINED_ROLES.find((r) => r.id === selectedRoleId) || PREDEFINED_ROLES[1]

  const setupMessages = [
    'Configuring role-adaptive terminology...',
    'Tailoring navigation shortcuts & action buttons...',
    'Launching your WBS & Roadmap workspace...',
  ]

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen)
      return
    }

    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('zanarepo_onboarding_completed')
      if (completed !== 'true') {
        setIsOpen(true)
      }
    }
  }, [externalIsOpen])

  const handleProceed = () => {
    setIsSettingUp(true)

    if (typeof window !== 'undefined') {
      localStorage.setItem('zanarepo_user_persona', selectedPreset.persona)
      localStorage.setItem('zanarepo_user_role_title', selectedRoleId === 'other' && customRoleInput ? customRoleInput : selectedPreset.label)
      localStorage.setItem('zanarepo_onboarding_completed', 'true')
      window.dispatchEvent(new Event('zanarepo_persona_changed'))
    }

    setTimeout(() => setSetupStep(1), 500)
    setTimeout(() => setSetupStep(2), 1000)

    setTimeout(async () => {
      let targetProjectId = projectId

      if (!targetProjectId && organizationId) {
        try {
          const supabase = createClient()
          const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(1)

          if (projects && projects.length > 0) {
            targetProjectId = projects[0].id
          }
        } catch (e) {
          // ignore lookup error
        }
      }

      setIsSettingUp(false)
      setIsOpen(false)
      if (onClose) onClose()

      if (targetProjectId) {
        router.push(`/dashboard/projects/${targetProjectId}?tab=wbs`)
      } else {
        router.push('/dashboard')
      }
    }, 1700)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-app-bg backdrop-blur-2xl animate-in fade-in duration-200">
      
      {/* Single Sleek Centered Card (Linear / Jira Onboarding Style) */}
      <div className="relative w-full max-w-md bg-app-surface-solid border border-app-border rounded-3xl p-7 shadow-2xl overflow-hidden transition-all">
        
        {/* Subtle Orb Background Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {!isSettingUp ? (
          <div className="relative z-10 space-y-5">
            
            {/* Header Logo & Title */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center mb-1">
                <Image
                  src="/prazaner_logo_light.png"
                  alt="Prazaner"
                  width={130}
                  height={36}
                  className="dark:hidden block h-9 w-auto object-contain"
                  priority
                />
                <Image
                  src="/prazaner_logo_transparent.png"
                  alt="Prazaner"
                  width={130}
                  height={36}
                  className="hidden dark:block h-9 w-auto object-contain"
                  priority
                />
              </div>
              <h2 className="text-2xl font-black text-app-fg tracking-tight">
                Welcome to Prazaner
              </h2>
              <p className="text-xs text-app-muted">
                What describes your role best?
              </p>
            </div>

            {/* Intuitive Role Selection Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {PREDEFINED_ROLES.map((role) => {
                const isSelected = selectedRoleId === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-violet-500/15 border-violet-500 text-violet-600 dark:text-violet-400 ring-2 ring-violet-500/20 shadow-xs'
                        : 'bg-app-surface border-app-border text-app-fg hover:border-app-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base shrink-0">{role.emoji}</span>
                      <span className="truncate">{role.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {/* Custom input for "Other Role" */}
            {selectedRoleId === 'other' && (
              <div className="animate-in fade-in duration-150">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  placeholder="Type your title (e.g. Operations Lead)..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-app-bg border border-app-border focus:border-violet-500 focus:outline-none text-app-fg"
                />
              </div>
            )}

            {/* Workflow Mode Preset Preview */}
            <div className="p-3.5 rounded-2xl bg-app-bg/70 border border-app-border flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-app-subtle block text-[10px] uppercase font-extrabold tracking-wider">
                  Preset Workflow
                </span>
                <span className="font-bold text-app-fg text-xs">
                  {selectedPreset.presetName}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 font-mono text-[11px] font-bold shrink-0">
                {selectedPreset.actionLabel}
              </span>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleProceed}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        ) : (
          /* Sleek Setup Loading Animation */
          <div className="relative z-10 py-10 text-center space-y-5 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-violet-500/30">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-black text-app-fg tracking-tight">
                Setting up your workspace...
              </h3>
              <p className="text-xs font-mono text-violet-600 dark:text-violet-400 font-semibold h-4 transition-all">
                {setupMessages[setupStep]}
              </p>
            </div>

            <div className="w-full bg-app-surface border border-app-border rounded-full h-1.5 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: setupStep === 0 ? '33%' : setupStep === 1 ? '66%' : '100%' }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
