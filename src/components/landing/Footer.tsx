import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] px-6 py-10 bg-[#000000]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-600">
        <span>© 2026 Baseline. All rights reserved.</span>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
          <Link href="/status" className="hover:text-slate-400 transition-colors">Status</Link>
        </div>
      </div>
    </footer>
  )
}
