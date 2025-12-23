'use client'

import { useSearchParams } from 'next/navigation'

export default function LoginFeedback() {
  const params = useSearchParams()
  const loggedOut = params?.get('logged_out')

  if (!loggedOut) return null

  return (
    <div className="mb-4 rounded-md bg-green-100 border border-green-200 p-3 text-sm text-green-800">
      Anda berhasil logout. Silakan masuk kembali.
    </div>
  )
}
