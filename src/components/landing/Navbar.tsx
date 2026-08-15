import Link from 'next/link'
import Image from 'next/image'

export function Navbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#000000]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          {/* Prazaner Light Mode Logo */}
          <Image
            src="/prazaner_logo_light.png"
            alt="Prazaner"
            width={120}
            height={40}
            className="dark:hidden block h-10 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
          {/* Prazaner Dark Mode Logo */}
          <Image
            src="/prazaner_logo_transparent.png"
            alt="Prazaner"
            width={120}
            height={40}
            className="hidden dark:block h-10 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
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
