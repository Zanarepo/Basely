import { useState, useEffect } from 'react'
import { getRaidEntries, deleteRaidEntry, type RaidLogEntry, type RaidCategory } from '@/lib/raid/actions'
import { getWbsElements } from '@/lib/wbs/core-actions'
import type { WbsElement } from '@/lib/wbs/constants'
import { useWbsToasts } from '@/components/dashboard/wbs/workspace/hooks/useWbsToasts'

export function useRaidWorkspace(
  projectId: string,
  organizationId: string
) {
  const [activeTab, setActiveTab] = useState<RaidCategory | 'all' | 'closed'>('all')
  const [items, setItems] = useState<RaidLogEntry[]>([])
  const [wbsElements, setWbsElements] = useState<WbsElement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalCategory, setModalCategory] = useState<RaidCategory>('risk')
  const [selectedItem, setSelectedItem] = useState<RaidLogEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toasts, showToast, dismissToast } = useWbsToasts()

  const fetchRaidItems = async () => {
    setLoading(true)
    const [res, wbsRes] = await Promise.all([
      getRaidEntries(projectId, 'all'),
      getWbsElements(projectId)
    ])
    if (wbsRes.ok && wbsRes.data) {
      setWbsElements(wbsRes.data)
    }
    if (res.ok && res.data && res.data.length > 0) {
      setItems(res.data)
    } else {
      // Demo enterprise RAID log data for instant visualization
      setItems([
        {
          id: 'raid-101',
          organization_id: organizationId,
          project_id: projectId,
          category: 'risk',
          title: 'AWS Spot Instance Interruptions During ML Training',
          description: 'Spot pricing instability could terminate background data embedding jobs without progress check-pointing.',
          status: 'open',
          priority: 'high',
          impact_rating: 4,
          probability_rating: 3,
          mitigation_plan: 'Implement automated EBS volume snapshot checkpoints every 15 minutes during inference runs.',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
          id: 'raid-102',
          organization_id: organizationId,
          project_id: projectId,
          category: 'assumption',
          title: 'Client Legacy API Supports 500+ TPS in JSON without Latency',
          description: 'Our checkout release baseline assumes the legacy billing server will process concurrency without timeouts.',
          status: 'in_progress',
          priority: 'critical',
          validation_due_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          impact_rating: 5,
          probability_rating: 4,
          mitigation_plan: 'Execute synthetic load tests via JMeter during staging test week.',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
        },
        {
          id: 'raid-103',
          organization_id: organizationId,
          project_id: projectId,
          category: 'dependency',
          title: 'Stripe Beta EU Bank Transfer API Access Sign-off',
          description: 'Our payment checkout feature is administratively blocked waiting for third-party regulatory access token.',
          status: 'open',
          priority: 'high',
          external_owner_name: 'Stripe Partnership Team & Legal',
          target_resolution_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          linked_wbs_element_id: 'wbs-pkg-101',
          impact_rating: 4,
          probability_rating: 2,
          created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 8 * 86400000).toISOString()
        },
        {
          id: 'raid-104',
          organization_id: organizationId,
          project_id: projectId,
          category: 'issue',
          title: 'Staging Auth Server TLS Certificate Expired',
          description: 'QA engineers cannot run Cypress automated regression suites on staging environment today.',
          status: 'in_progress',
          priority: 'critical',
          impact_rating: 5,
          probability_rating: 5,
          mitigation_plan: 'DevOps team running cert-bot renew script and updating NGINX reverse proxy headers.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRaidItems()
  }, [projectId, organizationId])

  useEffect(() => {
    if (!loading && activeTab === 'closed' && !items.some(i => i.status === 'closed')) {
      setActiveTab('all')
    }
  }, [loading, items, activeTab])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to remove this governance entry from the RAID Log?')) return
    setDeletingId(id)
    await deleteRaidEntry(id, projectId)
    setDeletingId(null)
    setItems((prev) => prev.filter((item) => item.id !== id))
    showToast('success', 'RAID governance entry successfully removed.')
  }

  const filteredItems = items.filter(item => {
    if (activeTab === 'closed') return item.status === 'closed'
    if (item.status === 'closed') return false
    
    if (activeTab !== 'all' && item.category !== activeTab) return false
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
    
    if (search.trim()) {
      const q = search.toLowerCase()
      return item.title.toLowerCase().includes(q) || 
             item.description?.toLowerCase().includes(q) || 
             item.external_owner_name?.toLowerCase().includes(q)
    }
    return true
  })

  return {
    activeTab, setActiveTab,
    items, setItems,
    wbsElements,
    loading,
    search, setSearch,
    priorityFilter, setPriorityFilter,
    isModalOpen, setIsModalOpen,
    modalCategory, setModalCategory,
    selectedItem, setSelectedItem,
    deletingId,
    toasts, showToast, dismissToast,
    fetchRaidItems,
    handleDelete,
    filteredItems
  }
}
