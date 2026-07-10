import { AuthThemeToggle } from '@/components/AuthThemeToggle'

type AuthPageShellProps = {
  children: React.ReactNode
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-app-bg overflow-hidden font-sans transition-colors duration-200">
      <AuthThemeToggle />

      <div
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: 'var(--app-orb-violet)' }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: 'var(--app-orb-indigo)' }}
      />

      <div
        className="absolute inset-0 opacity-30 pointer-events-none mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--app-grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--app-grid-line) 1px, transparent 1px)',
          backgroundSize: '4rem 4rem',
        }}
      />

      <div className="w-full max-w-md px-6 z-10 my-12">{children}</div>
    </main>
  )
}
