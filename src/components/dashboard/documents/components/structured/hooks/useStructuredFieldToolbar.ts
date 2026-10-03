import { useState, useRef, useEffect } from 'react'

export function useStructuredFieldToolbar({
  documentType = '',
  sectionTitle = '',
  insertFormatting,
}: {
  documentType?: string
  sectionTitle?: string
  insertFormatting: (prefix: string, suffix?: string) => void
}) {
  const [showCalloutMenu, setShowCalloutMenu] = useState(false)
  const [showAiPopover, setShowAiPopover] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const calloutMenuRef = useRef<HTMLDivElement>(null)
  const aiPopoverRef = useRef<HTMLDivElement>(null)
  const aiButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const updatePopoverPos = () => {
    if (aiButtonRef.current) {
      const rect = aiButtonRef.current.getBoundingClientRect()
      const popoverHeight = Math.min(window.innerHeight * 0.6, 440)
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < popoverHeight && rect.top > popoverHeight

      const top = openUpward
        ? Math.max(12, rect.top - popoverHeight - 8)
        : Math.min(window.innerHeight - popoverHeight - 12, rect.bottom + 8)

      const left = Math.max(16, Math.min(rect.left, window.innerWidth - 340))
      setPopoverPos({ top, left })
    }
  }

  const handleToggleAiPopover = () => {
    if (!showAiPopover) {
      updatePopoverPos()
    }
    setShowAiPopover((prev) => !prev)
  }

  useEffect(() => {
    if (showAiPopover) {
      updatePopoverPos()
      window.addEventListener('scroll', updatePopoverPos, true)
      window.addEventListener('resize', updatePopoverPos)
      return () => {
        window.removeEventListener('scroll', updatePopoverPos, true)
        window.removeEventListener('resize', updatePopoverPos)
      }
    }
  }, [showAiPopover])

  const titleLower = sectionTitle.toLowerCase()
  const docLower = documentType.toLowerCase()

  const isMarketResearchContext =
    docLower.includes('market') ||
    docLower.includes('research') ||
    docLower.includes('tam') ||
    docLower.includes('icp') ||
    docLower.includes('persona') ||
    docLower.includes('discovery') ||
    docLower.includes('win_loss') ||
    docLower.includes('pricing') ||
    docLower.includes('voc') ||
    titleLower.includes('market') ||
    titleLower.includes('research') ||
    titleLower.includes('tam') ||
    titleLower.includes('sam') ||
    titleLower.includes('som') ||
    titleLower.includes('icp') ||
    titleLower.includes('persona') ||
    titleLower.includes('interview') ||
    titleLower.includes('pricing') ||
    titleLower.includes('swot')

  const isRoadmapContext =
    docLower.includes('roadmap') ||
    titleLower.includes('roadmap') ||
    titleLower.includes('horizon') ||
    titleLower.includes('now') ||
    titleLower.includes('next') ||
    titleLower.includes('later') ||
    titleLower.includes('theme') ||
    titleLower.includes('timeline') ||
    titleLower.includes('release') ||
    titleLower.includes('milestone')

  const isStrategyContext =
    docLower.includes('strategy') ||
    docLower.includes('canvas') ||
    docLower.includes('competitive') ||
    docLower.includes('vision') ||
    docLower.includes('okr') ||
    titleLower.includes('strategy') ||
    titleLower.includes('vision') ||
    titleLower.includes('okr') ||
    titleLower.includes('moat') ||
    titleLower.includes('positioning') ||
    titleLower.includes('value proposition') ||
    titleLower.includes('pillars')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calloutMenuRef.current && !calloutMenuRef.current.contains(e.target as Node)) {
        setShowCalloutMenu(false)
      }
      if (
        aiPopoverRef.current &&
        !aiPopoverRef.current.contains(e.target as Node) &&
        aiButtonRef.current &&
        !aiButtonRef.current.contains(e.target as Node)
      ) {
        setShowAiPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const insertCallout = (type: 'note' | 'tip' | 'important' | 'warning') => {
    let block = ''
    if (type === 'note') {
      block = `> [!NOTE]\n> Write helpful background context or implementation notes here...\n\n`
    } else if (type === 'tip') {
      block = `> [!TIP]\n> Write strategic tips, best practices, or efficiency recommendations here...\n\n`
    } else if (type === 'important') {
      block = `> [!IMPORTANT]\n> Detail essential requirements, key decisions, or critical milestones...\n\n`
    } else if (type === 'warning') {
      block = `> [!WARNING]\n> Highlight potential risks, dependencies, or breaking changes here...\n\n`
    }
    insertFormatting(block, '')
    setShowCalloutMenu(false)
  }

  return {
    showCalloutMenu,
    setShowCalloutMenu,
    showAiPopover,
    setShowAiPopover,
    customPrompt,
    setCustomPrompt,
    isMounted,
    popoverPos,
    calloutMenuRef,
    aiPopoverRef,
    aiButtonRef,
    isMarketResearchContext,
    isRoadmapContext,
    isStrategyContext,
    handleToggleAiPopover,
    insertCallout,
  }
}
