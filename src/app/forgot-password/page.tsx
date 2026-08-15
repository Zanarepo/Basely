import type { Metadata } from 'next'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Reset Password | Prazaner',
  description: 'Request a secure link to reset your Prazaner account password.',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
