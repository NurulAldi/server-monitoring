import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect root URL to login
  redirect('/autentikasi')
}