'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Grid, 
  LayoutDashboard, 
  Workflow, 
  CalendarRange, 
  ShieldAlert, 
  FileCode, 
  Users, 
  Rocket, 
  CircleDollarSign, 
  UsersRound, 
  AlertTriangle, 
  Files, 
  CheckSquare, 
  Settings, 
  LifeBuoy, 
  BrainCircuit, 
  UserCircle, 
  Target, 
  Star,
  Lock,
  ChevronRight
} from 'lucide-react'

// Define all platform features
export type FeatureApp = {
  id: string
  label: string
  description: string
  icon: React.ElementType
  colorClass: string
  bgClass: string
  isGlobal?: boolean
  requiredTier?: 'free' | 'pro' | 'enterprise'
  path: string // For global features, the direct path. For project features, the tab id.
}

const ALL_FEATURES: FeatureApp[] = [
  // Global Features
  { id: 'global_dashboard', label: 'Dashboard', description: 'Overview of all your projects', icon: LayoutDashboard, colorClass: 'text-violet-500', bgClass: 'bg-violet-500/10', isGlobal: true, path: '/dashboard' },
  { id: 'approvals', label: 'Approvals', description: 'Enterprise approval workflows', icon: CheckSquare, colorClass: 'text-rose-500', bgClass: 'bg-rose-500/10', isGlobal: true, requiredTier: 'enterprise', path: '/dashboard/approvals' },
  { id: 'templates', label: 'Templates', description: 'Workspace project templates', icon: Settings, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10', isGlobal: true, requiredTier: 'pro', path: '/dashboard/settings/templates' },
  
  // Project Level Features
  { id: 'wbs', label: 'WBS', description: 'Work Breakdown Structure', icon: Workflow, colorClass: 'text-indigo-400', bgClass: 'bg-indigo-500/10', path: 'wbs' },
  { id: 'gantt', label: 'Gantt', description: 'Timeline and scheduling', icon: CalendarRange, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', path: 'gantt' },
  { id: 'cost', label: 'Budget & Cost', description: 'Financial tracking & EVM', icon: CircleDollarSign, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10', requiredTier: 'pro', path: 'cost' },
  { id: 'raid', label: 'RAID', description: 'Risks, Actions, Issues, Decisions', icon: ShieldAlert, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10', path: 'raid' },
  { id: 'adr', label: 'ADR', description: 'Architecture Decisions', icon: FileCode, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', path: 'adr' },
  { id: 'capacity', label: 'Capacity', description: 'Skills & resource matrix', icon: Users, colorClass: 'text-fuchsia-400', bgClass: 'bg-fuchsia-500/10', path: 'capacity' },
  { id: 'releases', label: 'Releases', description: 'Iterations and deployments', icon: Rocket, colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10', path: 'releases' },
  { id: 'stakeholders', label: 'Stakeholders', description: 'Manage project people', icon: UsersRound, colorClass: 'text-pink-400', bgClass: 'bg-pink-500/10', path: 'stakeholders' },
  { id: 'risks', label: 'Risks', description: 'Risk register', icon: AlertTriangle, colorClass: 'text-red-400', bgClass: 'bg-red-500/10', path: 'risks' },
  { id: 'documents', label: 'Intelligence Hub', description: 'Strategy, Automations & Docs', icon: BrainCircuit, colorClass: 'text-slate-300', bgClass: 'bg-slate-500/10', path: 'documents' },
]

export function FeatureAppLauncher({ projectId, currentTier = 'free' }: { projectId?: string, currentTier?: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load stats
  useEffect(() => {
    try {
      const stored = localStorage.getItem('basepro_feature_clicks')
      if (stored) {
        setClickCounts(JSON.parse(stored))
      }
    } catch (e) {}
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const recordClick = (featureId: string) => {
    const newCounts = { ...clickCounts, [featureId]: (clickCounts[featureId] || 0) + 1 }
    setClickCounts(newCounts)
    localStorage.setItem('basepro_feature_clicks', JSON.stringify(newCounts))
  }

  const handleFeatureClick = (feature: FeatureApp) => {
    // Check tier
    const requiresPro = feature.requiredTier === 'pro' && currentTier === 'free'
    const requiresEnterprise = feature.requiredTier === 'enterprise' && currentTier !== 'enterprise'
    if (requiresPro || requiresEnterprise) return

    recordClick(feature.id)
    setIsOpen(false)

    if (feature.isGlobal) {
      router.push(feature.path)
    } else {
      if (projectId) {
        router.push(`/dashboard/projects/${projectId}?tab=${feature.path}`)
      } else {
        router.push('/dashboard') // Fallback if used globally without project
      }
    }
  }

  // Sort top 6 features by click count
  const sortedFeatures = [...ALL_FEATURES].sort((a, b) => (clickCounts[b.id] || 0) - (clickCounts[a.id] || 0))
  const topFeatures = sortedFeatures.slice(0, 6)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-app-muted hover:text-app-fg hover:bg-app-hover transition-colors flex items-center justify-center border border-transparent hover:border-app-border cursor-pointer"
        title="App Launcher"
      >
        <Grid className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[340px] md:w-[380px] bg-app-surface-solid border border-app-border rounded-2xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-app-border bg-app-surface/50 backdrop-blur-md">
            <h3 className="text-sm font-bold text-app-fg tracking-tight">Shortcut Arena</h3>
            <p className="text-xs text-app-muted mt-0.5">Your most frequently used tools.</p>
          </div>

          {/* Top Features Grid */}
          <div className="p-3 grid grid-cols-3 gap-2">
            {topFeatures.map(feature => {
              const isLocked = (feature.requiredTier === 'pro' && currentTier === 'free') || 
                               (feature.requiredTier === 'enterprise' && currentTier !== 'enterprise')

              return (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all group relative ${
                    isLocked ? 'opacity-50 cursor-not-allowed bg-app-bg/50' : 'hover:bg-app-hover hover:scale-105 active:scale-95 cursor-pointer bg-app-bg'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${feature.bgClass} ${feature.colorClass}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-app-muted group-hover:text-app-fg text-center leading-tight">
                    {feature.label}
                  </span>
                  {isLocked && (
                    <div className="absolute top-1 right-1">
                      <Lock className="w-3 h-3 text-app-muted" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* All Features List */}
          <div className="border-t border-app-border bg-app-bg">
            <div className="px-4 py-2 bg-app-surface-solid text-[10px] font-bold text-app-muted uppercase tracking-wider">
              All Apps
            </div>
            <div className="max-h-[220px] overflow-y-auto p-2 scrollbar-thin">
              {ALL_FEATURES.map(feature => {
                const isLocked = (feature.requiredTier === 'pro' && currentTier === 'free') || 
                                 (feature.requiredTier === 'enterprise' && currentTier !== 'enterprise')

                return (
                  <button
                    key={`list-${feature.id}`}
                    onClick={() => handleFeatureClick(feature)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                      isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-app-hover cursor-pointer'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${feature.bgClass} ${feature.colorClass}`}>
                      <feature.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-app-fg truncate flex items-center gap-2">
                        {feature.label}
                        {isLocked && <Lock className="w-3 h-3 text-app-muted shrink-0" />}
                      </div>
                      <div className="text-[10px] text-app-muted truncate">{feature.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
