import Link from 'next/link'

export function MobileCta({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  if (isLoggedIn) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-app-bg/90 backdrop-blur-md border-t border-app-border flex items-center gap-3">
      <Link href="/login" className="btn-primary flex-1 text-center text-sm py-3 rounded-lg shadow-lg">
        Start free — no card required
      </Link>
    </div>
  )
}
