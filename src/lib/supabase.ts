import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Отсутствуют ключи Supabase. Добавь VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в файл .env.local',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)