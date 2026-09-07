import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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

function Paw() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <g fill="#c4b5fd" stroke="#8b5cf6" strokeWidth="1.5">
        <ellipse cx="22" cy="29" rx="13" ry="11" />
        <ellipse cx="11" cy="15" rx="5" ry="5.5" />
        <ellipse cx="20" cy="10" rx="5" ry="5.5" />
        <ellipse cx="30" cy="12" rx="5" ry="5.5" />
        <ellipse cx="36" cy="22" rx="4.5" ry="5.5" />
      </g>
    </svg>
  )
}

function DealCard({
  deal,
  onPointerDown,
  onClick,
}: {
  deal: Deal
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>, dealId: string) => void
  onClick: () => void
}) {
  return (
    <div
      onPointerDown={(e) => onPointerDown(e, deal.id)}
      onClick={onClick}
      className="cursor-grab select-none rounded-lg border border-yellow-400 bg-yellow-200 p-4 shadow-sm transition hover:shadow-md active:cursor-grabbing"
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
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)

  const dragRef = useRef<{ dealId: string; moved: boolean } | null>(null)

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

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>, dealId: string) {
    e.preventDefault()
    dragRef.current = { dealId, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    setCursor({ x: e.clientX, y: e.clientY })
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || !dragRef.current) return

    const start = dragRef.current
    if (
      Math.abs(e.clientX - (cursor?.x ?? e.clientX)) > 2 ||
      Math.abs(e.clientY - (cursor?.y ?? e.clientY)) > 2
    ) {
      start.moved = true
    }

    setCursor({ x: e.clientX, y: e.clientY })

    const el = document.elementFromPoint(e.clientX, e.clientY)
    const columnEl = el?.closest('[data-column]') as HTMLElement | null
    setDragOverKey(columnEl?.dataset.column ?? null)
  }

  function handlePointerUp() {
    const start = dragRef.current
    if (start?.moved && dragOverKey) {
      moveDeal(start.dealId, dragOverKey)
    }
    dragRef.current = null
    setDragging(false)
    setCursor(null)
    setDragOverKey(null)
  }

  function handleClick(dealId: string) {
    if (dragRef.current?.moved) {
      dragRef.current.moved = false
      return
    }
    setSelectedId(dealId)
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
    <div
      className="flex min-h-screen flex-col bg-purple-200"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <header className="flex items-center justify-between border-b border-purple-300 bg-purple-100 px-6 py-4">
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
                data-column={column.key}
                className={`w-72 shrink-0 rounded-xl bg-purple-100 p-3 transition ${
                  dragOverKey === column.key ? 'bg-purple-300 ring-2 ring-purple-500' : ''
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
                      onPointerDown={handlePointerDown}
                      onClick={() => handleClick(deal.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {dragging && cursor && (
        <div
          className="paw-walk pointer-events-none fixed z-50"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <Paw />
        </div>
      )}

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