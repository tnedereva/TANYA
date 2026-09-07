export type Deal = {
  id: string
  client: string
  company: string | null
  contact: string | null
  amount: number | null
  note: string | null
  stage: string
  user_id: string
  created_at: string
}

export type Column = {
  key: string
  label: string
}

export const COLUMNS: Column[] = [
  { key: 'lead', label: 'Новый лид' },
  { key: 'in_work', label: 'В работе' },
  { key: 'negotiations', label: 'Переговоры' },
  { key: 'success', label: 'Успех' },
  { key: 'lost', label: 'Отказ' },
]