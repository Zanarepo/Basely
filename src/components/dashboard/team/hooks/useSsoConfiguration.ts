import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { saveSsoConfig, deleteSsoConfig as removeSsoConfig } from '@/lib/workspace/sso-actions'
export type SsoProtocol = 'saml' | 'oauth'

export interface SsoConfiguration {
  id?: string
  organization_id: string
  protocol: SsoProtocol
  idp_metadata: any
  certificate: string | null
  attribute_mapping: Record<string, string>
  enforced: boolean
  break_glass_admin_id: string | null
}

export function useSsoConfiguration(organizationId: string) {
  const [config, setConfig] = useState<SsoConfiguration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchConfig = useCallback(async () => {
    if (!organizationId) return

    try {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sso_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching SSO config:', error)
        return
      }

      setConfig(data)
    } catch (err) {
      console.error('Error in fetchConfig:', err)
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  const saveConfig = async (updates: Partial<SsoConfiguration>) => {
    if (!organizationId) return { success: false, error: 'Organization ID missing' }

    try {
      setIsSaving(true)
      const result = await saveSsoConfig(organizationId, updates, config?.id)

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to save SSO configuration' }
      }

      setConfig(result.data)
      return { success: true, error: null }
    } catch (err) {
      console.error('Error in saveConfig:', err)
      return { success: false, error: 'An unexpected error occurred while saving' }
    } finally {
      setIsSaving(false)
    }
  }

  const deleteConfig = async () => {
    if (!config?.id) return { success: false, error: 'Configuration not found' }
    
    try {
      setIsSaving(true)
      const result = await removeSsoConfig(organizationId, config.id)

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to remove SSO configuration' }
      }

      setConfig(null)
      return { success: true, error: null }
    } catch (err) {
      console.error('Error in deleteConfig:', err)
      return { success: false, error: 'An unexpected error occurred while deleting' }
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    isLoading,
    isSaving,
    saveConfig,
    deleteConfig,
    refresh: fetchConfig
  }
}
