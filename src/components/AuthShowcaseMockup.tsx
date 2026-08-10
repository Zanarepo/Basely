import React from 'react'
import { BarChart3, ArrowUpRight, CheckCircle2 } from 'lucide-react'

export function AuthShowcaseMockup() {
  return (
    <div className="relative w-full transform perspective-1000">
      {/* 3D tilt effect container */}
      <div className="relative rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl p-6 overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] transition-transform duration-500 hover:rotate-y-0 hover:rotate-x-0">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-200">Q3 Performance</h3>
              <p className="text-xs text-slate-400">Workspace Overview</p>
            </div>
          </div>
          <div className="flex -space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-[#0f172a] shadow-sm"></div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-[#0f172a] shadow-sm"></div>
            <div className="w-8 h-8 rounded-full bg-violet-600 border-2 border-[#0f172a] shadow-sm"></div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="text-xs font-medium text-slate-400 mb-1">Active Projects</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-slate-100">24</div>
              <div className="flex items-center text-xs font-semibold text-emerald-400 mb-1.5">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> 12%
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="text-xs font-medium text-slate-400 mb-1">Tasks Completed</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-slate-100">1,492</div>
              <div className="flex items-center text-xs font-semibold text-emerald-400 mb-1.5">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> 8%
              </div>
            </div>
          </div>
        </div>

        {/* Mock Task List */}
        <div className="space-y-3 mb-6">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recent Activity</div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-slate-300">Finalize Q3 roadmap</span>
            </div>
            <span className="text-xs text-slate-500">2h ago</span>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/20">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-slate-600"></div>
              <span className="text-sm text-slate-300">Review design mockups</span>
            </div>
            <span className="text-xs text-slate-500">In progress</span>
          </div>
        </div>

        {/* Glow effect overlay */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 blur-3xl pointer-events-none"></div>
      </div>
      
      {/* Decorative floating elements */}
      <div className="absolute -top-4 -right-4 w-12 h-12 bg-linear-to-tr from-violet-600 to-indigo-600 rounded-xl blur-xl opacity-50 animate-pulse"></div>
    </div>
  )
}
