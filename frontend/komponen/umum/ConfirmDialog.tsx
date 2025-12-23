'use client'

// Lightweight modal without external dependencies
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 z-50">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-2">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 rounded-md bg-slate-100 text-slate-700" onClick={onCancel}>Batal</button>
          <button className="px-4 py-2 rounded-md bg-red-600 text-white" onClick={onConfirm}>Keluar</button>
        </div>
      </div>
    </div>
  )
}
