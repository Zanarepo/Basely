import { AuthThemeToggle } from '@/components/AuthThemeToggle'
import { Shield } from 'lucide-react' // Using Shield as an enterprise logo placeholder
import { AuthShowcaseMockup } from './AuthShowcaseMockup'

type AuthPageShellProps = {
  children: React.ReactNode
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="relative min-h-screen w-full flex flex-col lg:flex-row bg-app-bg font-sans transition-colors duration-200">
      <AuthThemeToggle />

      {/* Left Pane - Product Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex relative w-full lg:w-1/2 bg-[#020617] border-r border-app-border overflow-hidden flex-col p-12">
        {/* Sleek abstract background for the showcase */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none mask-[radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
          }}
        />
        <div
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none"
          style={{ backgroundColor: 'rgba(126, 34, 206, 0.2)' }} // Violet orb
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none"
          style={{ backgroundColor: 'rgba(79, 70, 229, 0.2)' }} // Indigo orb
        />

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col h-full w-full max-w-lg mx-auto">
          {/* Branding & Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">Baseline</span>
          </div>

          {/* Essence Statement */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-white mb-4 leading-tight">
              The foundation for modern enterprise workflows.
            </h1>
            <p className="text-lg text-slate-400 font-medium">
              Streamline your project management with intelligent features, unparalleled security, and a beautiful interface.
            </p>
          </div>

          {/* Mockup */}
          <div className="flex-1 flex items-center justify-center pt-8">
            <AuthShowcaseMockup />
          </div>
        </div>
      </div>

      {/* Right Pane - Auth Form Container */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
        {/* Subtle grid for right side (optional, keeps continuity) */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--app-grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--app-grid-line) 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
          }}
        />
        
        <div className="w-full max-w-sm z-10 mt-8 lg:mt-0">
          {children}
        </div>
      </div>
    </main>
  )
}

