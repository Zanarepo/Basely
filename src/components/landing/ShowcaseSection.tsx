import { WbsMockup } from './WbsMockup'
import { DashboardMockup } from './DashboardMockup'
import { CollaborationMockup } from './CollaborationMockup'
import { ProjectClosureMockup } from './ProjectClosureMockup'

export function ShowcaseSection() {
  return (
    <section className="px-6 py-24 bg-[#000000]" id="showcase">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
          <p className="font-mono text-[11px] text-violet-400/50 mb-3 tracking-widest">METHODOLOGY AGNOSTIC</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1] mb-6 text-white">
            Built for strict Waterfall phases.<br/>And iterative Agile sprints.
          </h2>
          <p className="text-slate-400 text-[17px] leading-relaxed">
            Whether you are building a bridge or a mobile app, Baseline adapts to your workflow. Plan your work packages, assign costs, and track execution in one unified platform.
          </p>
        </div>

        <div className="space-y-24">
          
          {/* WBS Mockup Feature */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Cost-Integrated Work Breakdown</h3>
                <p className="text-slate-500 text-[14px] leading-relaxed">Assign owners and attach budgets directly to your WBS nodes.</p>
              </div>
            </div>
            {/* Violet gradient border */}
            <div className="p-px rounded-xl" style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.25), rgba(79,70,229,0.1), transparent)' }}>
              <div className="rounded-[11px] overflow-hidden bg-[#0A0A0C]">
                <WbsMockup />
              </div>
            </div>
          </div>

          {/* Dashboard Mockup Feature */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Real-time Earned Value Management</h3>
                <p className="text-slate-500 text-[14px] leading-relaxed">No more manual spreadsheet reconciliations. Baseline automatically calculates your CPI, SPI, and EAC based on actual progress and logged costs.</p>
              </div>
            </div>
            <div className="p-px rounded-xl" style={{ background: 'linear-gradient(to bottom, rgba(79,70,229,0.25), rgba(124,58,237,0.1), transparent)' }}>
              <div className="rounded-[11px] overflow-hidden bg-[#0A0A0C]">
                <DashboardMockup />
              </div>
            </div>
          </div>

          {/* Collaboration Mockup Feature */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">A Unified Platform for Everything</h3>
                <p className="text-slate-500 text-[14px] leading-relaxed">
                  End-to-end data flow with no disjointed documentation. Team members can seamlessly collaborate and reference any project artifact—from risks and charters to product requirements—directly in chat context.
                </p>
              </div>
            </div>
            <div className="p-8 rounded-xl flex justify-center" style={{ background: 'linear-gradient(to bottom, rgba(56,189,248,0.15), rgba(59,130,246,0.05), transparent)' }}>
              <div className="w-full transform hover:scale-[1.01] transition-transform duration-500">
                <CollaborationMockup />
              </div>
            </div>
          </div>

          {/* Project Closure Mockup Feature */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Automated Project Closure & Reporting</h3>
                <p className="text-slate-500 text-[14px] leading-relaxed">
                  When a project wraps up, instantly generate comprehensive performance reports. Baseline aggregates your final EVM financial summaries, schedule adherence, and deliverable sign-offs into a single, verifiable snapshot.
                </p>
              </div>
            </div>
            <div className="p-px rounded-xl" style={{ background: 'linear-gradient(to bottom, rgba(249,115,22,0.25), rgba(239,68,68,0.1), transparent)' }}>
              <div className="rounded-[11px] overflow-hidden bg-[#0A0A0C]">
                <ProjectClosureMockup />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
