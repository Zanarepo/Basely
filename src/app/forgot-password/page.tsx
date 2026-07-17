import type { Metadata } from 'next'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Reset Password | Basely',
  description: 'Request a secure link to reset your Basely account password.',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
