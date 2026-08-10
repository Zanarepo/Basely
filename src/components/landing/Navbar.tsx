import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export function Navbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#000000]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          {/* Brand violet logo */}
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/30">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-white">Baseline</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-400">
          <a href="#showcase" className="hover:text-white transition-colors">Product</a>
          <a href="#proof" className="hover:text-white transition-colors">Customers</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link href="/dashboard" className="landing-btn-secondary text-[13px] px-4 py-1.5 min-h-[32px]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block text-[13px] font-medium text-slate-400 hover:text-white transition-colors">
                Log in
              </Link>
              {/* Brand gradient CTA */}
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-1.5 min-h-[32px] text-[13px] font-semibold text-white cursor-pointer transition-all hover:opacity-90" style={{ background: 'linear-gradient(to right, #7c3aed, #4f46e5)', boxShadow: '0 4px 14px rgba(109,40,217,0.25)' }}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
