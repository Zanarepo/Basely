import React from 'react'
import { MessageCircle, FileText, AlertTriangle, CheckSquare, Send, X, Network, CheckCircle2, ArrowRight, ArrowRightCircle } from 'lucide-react'

export function CollaborationMockup() {
  return (
    <div className="w-full font-sans grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
      
      {/* Visual Connector for Desktop */}
      <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 text-white/20">
        <div className="bg-[#05050A] p-2 rounded-full border border-white/10">
          <ArrowRight className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      {/* Left Column: The Chat Context */}
      <div className="w-full bg-[#0A0A0C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2.5 text-white">
            <Network className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold tracking-tight text-[15px]">Story Details <span className="text-white/40 font-normal ml-1">(3.2)</span></h3>
          </div>
          <button className="text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-white/90 font-medium">
            <MessageCircle className="w-4 h-4 text-violet-400" />
            <h4 className="text-sm">Comments</h4>
          </div>

          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 text-xs font-bold">
              P
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-semibold text-white/90 text-[13px]">Prince</span>
                <span className="text-white/40 text-[11px]">about 1 hour ago</span>
              </div>
              
              <div className="text-white/70 text-[13px] leading-relaxed mb-3">
                <span className="bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-md font-medium">@Patrick</span> please check out these documents for reference before starting the integration:
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer">
                  <FileText className="w-3 h-3" />
                  Charter: Project Charter
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer">
                  <FileText className="w-3 h-3" />
                  Document: Product Requirements Doc
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors cursor-pointer">
                  <AlertTriangle className="w-3 h-3" />
                  Risk: auth service downtime
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors cursor-pointer ring-2 ring-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  <CheckSquare className="w-3 h-3" />
                  Task: Build Authentication Page
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-[#0A0A0C]">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Add a comment... (Type @ to mention, # for references)" 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-[13px] text-white placeholder-white/30 focus:outline-none transition-all"
              readOnly
            />
            <button className="absolute right-2 p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: The Action/Detail (Modal) */}
      <div className="w-full bg-[#111116] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col relative z-10 scale-[0.98] origin-left">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-white">
            <CheckSquare className="w-4 h-4 text-violet-400" />
            <span className="font-semibold capitalize text-sm">Task Details</span>
          </div>
          <button className="p-1 text-white/40 hover:text-white rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-[17px] font-bold text-white leading-snug">Build Authentication Page</h3>
            <span className="inline-flex mt-2 px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              Status: In Progress
            </span>
          </div>
          
          <div className="text-[13px] text-slate-300 leading-relaxed border-l-2 border-violet-500/30 pl-3 py-1">
            Implement JWT-based authentication flow with OAuth providers (Google, GitHub). Ensure robust error handling for failed login attempts and integrate with the main layout schema.
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 mt-4">
            <div>
              <span className="block text-[11px] font-semibold tracking-wide text-white/40 uppercase mb-1">Assigned Owner</span>
              <div className="flex items-center gap-2 text-[13px] text-white">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[10px] text-cyan-300 font-bold">
                  P
                </div>
                Patrick
              </div>
            </div>
            <div>
              <span className="block text-[11px] font-semibold tracking-wide text-white/40 uppercase mb-1">Cost Estimation</span>
              <div className="text-[13px] text-white font-mono">$1,250</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <button className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors">
            Go to Task Dashboard
            <ArrowRightCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  )
}
