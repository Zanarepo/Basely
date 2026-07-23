'use server'

import { createClient } from '@/utils/supabase/server'
import { logGovernanceEvent } from '@/lib/governance/actions'
import type { SsoConfiguration } from '@/components/dashboard/team/hooks/useSsoConfiguration'

export async function saveSsoConfig(
  organizationId: string,
  updates: Partial<SsoConfiguration>,
  existingConfigId?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'You must be signed in' }

    const payload = {
      organization_id: organizationId,
      ...updates,
    }

    let response
    if (existingConfigId) {
      response = await supabase
        .from('sso_configurations')
        .update(payload)
        .eq('id', existingConfigId)
        .select()
        .single()
    } else {
      response = await supabase
        .from('sso_configurations')
        .insert(payload)
        .select()
        .single()
    }

    if (response.error) {
      console.error('Error saving SSO config:', response.error)
      return { success: false, error: 'Failed to save SSO configuration' }
    }

    // Log the governance event securely on the server
    await logGovernanceEvent(organizationId, 'sso_config_change', {
      action: existingConfigId ? 'update_sso_config' : 'create_sso_config',
      config_id: response.data.id,
      protocol: response.data.protocol,
      enforced: response.data.enforced
    })

    return { success: true, data: response.data, error: null }
  } catch (err) {
    console.error('Error in saveSsoConfig action:', err)
    return { success: false, error: 'An unexpected error occurred while saving' }
  }
}

export async function deleteSsoConfig(organizationId: string, configId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'You must be signed in' }

    const { error } = await supabase
      .from('sso_configurations')
      .delete()
      .eq('id', configId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting SSO config:', error)
      return { success: false, error: 'Failed to remove SSO configuration' }
    }

    // Log the governance event securely on the server
    await logGovernanceEvent(organizationId, 'sso_config_change', {
      action: 'delete_sso_config',
      config_id: configId
    })

    return { success: true, error: null }
  } catch (err) {
    console.error('Error in deleteSsoConfig action:', err)
    return { success: false, error: 'An unexpected error occurred while deleting' }
  }
}
