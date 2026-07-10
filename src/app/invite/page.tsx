import { redirect } from 'next/navigation'
import { InviteError } from '@/components/InviteError'

type InvitePageProps = {
  searchParams: Promise<{ token?: string }>
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const { token } = await searchParams

  if (!token?.trim()) {
    return <InviteError message="This invitation link is missing a token." />
  }

  redirect(`/invite/accept?token=${encodeURIComponent(token)}`)
}