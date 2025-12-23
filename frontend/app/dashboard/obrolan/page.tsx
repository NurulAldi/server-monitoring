import { redirect } from 'next/navigation'

export default function HalamanObrolan() {
  // Chat page removed — keep FloatingChatButton on dashboard only
  redirect('/dashboard')
}