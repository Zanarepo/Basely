import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] px-6 py-10 bg-[#000000]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-slate-400">
        <div className="flex items-center gap-3">
          {/* Prazaner Light Mode Logo */}
          <Image
            src="/prazaner_logo_light.png"
            alt="Prazaner"
            width={96}
            height={32}
            className="dark:hidden block h-8 w-auto object-contain"
          />
          {/* Prazaner Dark Mode Logo */}
          <Image
            src="/prazaner_logo_transparent.png"
            alt="Prazaner"
            width={96}
            height={32}
            className="hidden dark:block h-8 w-auto object-contain"
          />
          
          <span className="text-slate-600 text-xs font-mono">© 2026. All rights reserved.</span>
        </div>
        <div className="flex gap-6 text-[11px] font-mono text-slate-500">
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
          <Link href="/status" className="hover:text-slate-300 transition-colors">Status</Link>
        </div>
      </div>
    </footer>
  )
}
