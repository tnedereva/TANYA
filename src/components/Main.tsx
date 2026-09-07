import { useEffect, useState, type DragEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { COLUMNS } from '../lib/types'
import type { Deal } from '../lib/types'
import AddDealModal from './AddDealModal'
import DealDetailModal from './DealDetailModal'

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

function DealCard({
  deal,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  deal: Deal
  onDragStart: (e: DragEvent) => void
  onDragEnd: () => void
  onClick: () => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="cursor-grab rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md active:cursor-grabbing"
    >
      <p className="text-lg font-semibold text-gray-900">{deal.client}</p>
      {deal.company && <p className="mt-0.5 text-sm text-gray-600">{deal.company}</p>}
      {deal.amount != null && (
        <p className="mt-2 font-medium text-gray-800">{currency.format(deal.amount)}</p>
      )}
    </div>
  )
}

function Main({ session }: { session: Session }) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    loadDeals()
  }, [])

  function onDealWon(deal: Deal) {
    console.log('Сделка завершена успехом:', deal)
    // сюда позже подключим уведомления/интеграции
  }

  async function loadDeals() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setDeals(data ?? [])
    }
    setLoading(false)
  }

  function handleDragStart(e: DragEvent, dealId: string) {
    setDraggedId(dealId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', dealId)
  }

  function handleColumnDragOver(e: DragEvent, columnKey: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverKey !== columnKey) setDragOverKey(columnKey)
  }

  function handleColumnDragLeave() {
    setDragOverKey(null)
  }

  function handleDrop(e: DragEvent, columnKey: string) {
    e.preventDefault()
    setDragOverKey(null)
    const dealId = draggedId || e.dataTransfer.getData('text/plain')
    if (dealId) moveDeal(dealId, columnKey)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverKey(null)
  }

  function moveDeal(dealId: string, toStage: string) {
    const deal = deals.find((d) => d.id === dealId)
    if (!deal || deal.stage === toStage) return

    const prevStage = deal.stage
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: toStage } : d)))

    supabase
      .from('deals')
      .update({ stage: toStage })
      .eq('id', dealId)
      .then(({ error }) => {
        if (error) {
          setError(error.message)
          setDeals((prev) =>
            prev.map((d) => (d.id === dealId ? { ...d, stage: prevStage } : d)),
          )
        } else if (toStage === 'success') {
          onDealWon({ ...deal, stage: toStage })
        }
      })
  }

  function handleSaved(updated: Deal) {
    setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
  }

  function handleDeleted(id: string) {
    setDeals((prev) => prev.filter((d) => d.id !== id))
    setSelectedId(null)
  }

  const selectedDeal = selectedId ? deals.find((d) => d.id === selectedId) ?? null : null

  const byStage: Record<string, Deal[]> = {}
  for (const column of COLUMNS) {
    byStage[column.key] = deals.filter((deal) => deal.stage === column.key)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Моя CRM</h1>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-500 sm:block">
            {session.user.email}
          </span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
          >
            + Новая сделка
          </button>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-600 transition hover:bg-gray-100"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            Не удалось загрузить сделки: {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Загрузка сделок…</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((column) => (
              <div
                key={column.key}
                onDragOver={(e) => handleColumnDragOver(e, column.key)}
                onDragLeave={handleColumnDragLeave}
                onDrop={(e) => handleDrop(e, column.key)}
                className={`w-72 shrink-0 rounded-xl bg-gray-100 p-3 transition ${
                  dragOverKey === column.key ? 'bg-gray-200 ring-2 ring-gray-400' : ''
                }`}
              >
                <h2 className="mb-3 font-semibold text-gray-700">
                  {column.label}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {byStage[column.key].length}
                  </span>
                </h2>
                <div className="flex flex-col gap-3">
                  {byStage[column.key].map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedId(deal.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <AddDealModal
          column={COLUMNS[0]}
          user={session.user}
          onClose={() => setShowModal(false)}
          onCreated={(deal) => setDeals((prev) => [deal, ...prev])}
        />
      )}

      {selectedDeal && (
        <DealDetailModal
          deal={selectedDeal}
          onDealWon={onDealWon}
          onClose={() => setSelectedId(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}

export default Main