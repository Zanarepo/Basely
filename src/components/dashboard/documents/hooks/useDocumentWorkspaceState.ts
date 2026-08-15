import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUserPersona } from '@/hooks/use-user-persona'
import { PRODUCT_SUITE_DOCS, PROJECT_SUITE_DOCS, DocumentItem } from '../constants/documentDefinitions'

export interface ToastMessage {
  id: string
  title: string
  type: 'success' | 'info' | 'warning'
}

export function useDocumentWorkspaceState() {
  const searchParams = useSearchParams()
  const { isProductMode } = useUserPersona()

  const initialDoc = searchParams.get('doc') as string | null

  const [activeSuite, setActiveSuite] = useState<'product' | 'project'>(
    isProductMode ? 'product' : 'project'
  )
  const [selectedDocId, setSelectedDocId] = useState<string | null>(initialDoc)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showGuideDrawer, setShowGuideDrawer] = useState(false)
  const [showWorkflowsDrawer, setShowWorkflowsDrawer] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const currentSuiteDocs = activeSuite === 'product' ? PRODUCT_SUITE_DOCS : PROJECT_SUITE_DOCS

  const filteredDocs = useMemo(() => {
    return currentSuiteDocs.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [currentSuiteDocs, searchQuery, selectedCategory])

  const selectedDocItem = useMemo(() => {
    if (!selectedDocId) return null
    return [...PRODUCT_SUITE_DOCS, ...PROJECT_SUITE_DOCS].find((d) => d.id === selectedDocId) || null
  }, [selectedDocId])

  const addToast = (titleOrType: string, typeOrMsg?: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    let title = titleOrType
    let type: 'success' | 'info' | 'warning' = 'success'

    if (typeOrMsg) {
      if (titleOrType === 'success' || titleOrType === 'error' || titleOrType === 'info') {
        type = titleOrType === 'error' ? 'warning' : (titleOrType as any)
        title = typeOrMsg
      } else {
        type = typeOrMsg as any
      }
    }

    setToasts((prev) => [...prev, { id, title, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleSuiteChange = (suite: 'product' | 'project') => {
    setActiveSuite(suite)
    setSelectedCategory('all')
  }

  return {
    activeSuite,
    selectedDocId,
    searchQuery,
    selectedCategory,
    showGuideDrawer,
    showWorkflowsDrawer,
    isDropdownOpen,
    activeSnapshotId,
    toasts,
    currentSuiteDocs,
    filteredDocs,
    selectedDocItem,
    setActiveSuite: handleSuiteChange,
    setSelectedDocId,
    setSearchQuery,
    setSelectedCategory,
    setShowGuideDrawer,
    setShowWorkflowsDrawer,
    setIsDropdownOpen,
    setActiveSnapshotId,
    addToast,
    dismissToast,
  }
}
