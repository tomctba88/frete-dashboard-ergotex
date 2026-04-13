'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BotaoLogout() {
  const router = useRouter()

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert('Não foi possível sair do sistema.')
      return
    }

    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '10px 14px',
        border: 'none',
        borderRadius: '10px',
        background: '#dc2626',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 700
      }}
    >
      Sair
    </button>
  )
}
