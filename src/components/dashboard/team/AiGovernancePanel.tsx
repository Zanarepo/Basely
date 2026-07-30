'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BrainCircuit, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function AiGovernancePanel({ organizationId }: { organizationId: string }) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadSetting() {
      const { data, error } = await supabase
        .from('organizations')
        .select('ai_wbs_generation_enabled')
        .eq('id', organizationId)
        .single()
        
      if (!error && data) {
        setIsEnabled(data.ai_wbs_generation_enabled || false)
      }
      setIsLoading(false)
    }
    loadSetting()
  }, [organizationId, supabase])

  const toggleSetting = async (checked: boolean) => {
    setIsSaving(true)
    setIsEnabled(checked)
    const { error } = await supabase
      .from('organizations')
      .update({ ai_wbs_generation_enabled: checked })
      .eq('id', organizationId)
      
    if (error) {
      toast.error('Failed to update AI settings')
      setIsEnabled(!checked)
    } else {
      toast.success(checked ? 'AI WBS Auto-Deconstruct Enabled' : 'AI WBS Auto-Deconstruct Disabled')
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="h-32 flex items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-3">
                AI Assistant Features
                {isEnabled ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    Disabled
                  </span>
                )}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Enable AI-powered automation for product management. When active, sending a Backlog Item to execution will automatically use AI to generate an Epic and break it down into realistic Work Packages based on the provided requirements.
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-3" />}
            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              disabled={isSaving}
              onClick={() => toggleSetting(!isEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
