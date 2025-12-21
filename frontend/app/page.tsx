import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect ke dashboard jika sudah login
  // Untuk sementara redirect ke halaman login
  redirect('/autentikasi')
}