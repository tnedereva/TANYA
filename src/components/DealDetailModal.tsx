import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { COLUMNS } from '../lib/types'
import type { Deal } from '../lib/types'

type Props = {
  deal: Deal
  onDealWon: (deal: Deal) => void
  onClose: () => void
  onSaved: (deal: Deal) => void
  onDeleted: (id: string) => void
}

function DealDetailModal({ deal, onDealWon, onClose, onSaved, onDeleted }: Props) {
  const [client, setClient] = useState(deal.client)
  const [company, setCompany] = useState(deal.company ?? '')
  const [contact, setContact] = useState(deal.contact ?? '')
  const [amount, setAmount] = useState(deal.amount != null ? String(deal.amount) : '')
  const [note, setNote] = useState(deal.note ?? '')
  const [stage, setStage] = useState(deal.stage)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const updates = {
      client,
      company,
      contact,
      amount: amount ? Number(amount) : null,
      note,
      stage,
    }

    const { error } = await supabase.from('deals').update(updates).eq('id', deal.id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }

    const updated: Deal = { ...deal, ...updates }
    onSaved(updated)
    if (deal.stage !== 'success' && stage === 'success') {
      onDealWon(updated)
    }
    onClose()
  }

  async function handleDelete() {
    setError('')
    setDeleting(true)
    const { error } = await supabase.from('deals').delete().eq('id', deal.id)
    setDeleting(false)
    if (error) {
      setError(error.message)
      return
    }
    onDeleted(deal.id)
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
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900">Детали сделки</h2>

        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-700">
            Клиент
            <input
              type="text"
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Клиент"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Компания
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Компания"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Контакт
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Контакт"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Сумма
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Сумма"
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Заметка
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Заметка"
              rows={3}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Этап
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className={`${inputClass} mt-1`}
            >
              {COLUMNS.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Удаление…' : 'Удалить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-gray-900 py-2 font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DealDetailModal