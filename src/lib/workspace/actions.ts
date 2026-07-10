'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ACTIVE_ORG_COOKIE } from './constants'

export async function setActiveWorkspace(organizationId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  revalidatePath('/dashboard', 'layout')
}
