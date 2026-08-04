import { redirect } from 'next/navigation'
import { InviteError } from '@/components/InviteError'

type InvitePageProps = {
  searchParams: Promise<{ token?: string, email?: string }>
}

export default async function BackofficeInvitePage({ searchParams }: InvitePageProps) {
  const { token, email } = await searchParams

  if (!token?.trim()) {
    return <InviteError message="This invitation link is missing a token." />
  }

  const url = new URL(`/backoffice/invite/accept`, process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  url.searchParams.set('token', token)
  if (email) url.searchParams.set('email', email)

  redirect(url.pathname + url.search)
}
