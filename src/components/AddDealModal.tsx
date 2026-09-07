import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Deal, Column } from '../lib/types'

type Props = {
  column: Column
  user: { id: string }
  onClose: () => void
  onCreated: (deal: Deal) => void
}

function AddDealModal({ column, user, onClose, onCreated }: Props) {
  const [client, setClient] = useState('')
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.from('deals').insert({
      client,
      company,
      contact,
      amount: amount ? Number(amount) : null,
      note,
      stage: column.key,
      user_id: user.id,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    onCreated({
      id: crypto.randomUUID(),
      client,
      company,
      contact,
      amount: amount ? Number(amount) : null,
      note,
      stage: column.key,
      user_id: user.id,
      created_at: new Date().toISOString(),
    })
    onClose()
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:border-gray-500'

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900">{column.label}</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            type="text"
            required
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Клиент"
            className={inputClass}
          />
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Компания"
            className={inputClass}
          />
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Контакт"
            className={inputClass}
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Сумма"
            className={inputClass}
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Заметка"
            rows={3}
            className={inputClass}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gray-900 py-2 font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddDealModal