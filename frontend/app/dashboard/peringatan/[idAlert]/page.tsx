import { redirect } from 'next/navigation'

export default function HalamanDetailAlert() {
  // Detail alert page removed — redirect to dashboard
  redirect('/dashboard')
}