import React from 'react'

export interface DocumentItem {
  id: string
  title: string
  category: 'initiation' | 'planning' | 'execution' | 'closure' | 'strategy' | 'requirements' | 'prioritization'
  suite: 'product' | 'project'
  icon: React.ElementType
  description: string
  guide: {
    purpose: string
    audience: string
    bestPractices: string[]
  }
  badge?: string
}
