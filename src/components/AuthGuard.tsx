'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const isLogin = pathname === '/login'

      if (!session && !isLogin) {
        router.replace('/login')
        return
      }

      if (session && isLogin) {
        router.replace('/')
        return
      }

      setLoading(false)
    }

    check()
  }, [pathname, router])

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Carregando...
      </div>
    )
  }

  return <>{children}</>
}