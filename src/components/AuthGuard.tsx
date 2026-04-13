'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type AuthGuardProps = {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      const isLoginPage = pathname === '/login'

      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (!session && !isLoginPage) {
        router.replace('/login')
        return
      }

      if (session && isLoginPage) {
        router.replace('/dashboard')
        return
      }

      setCheckingAuth(false)
    }

    checkAuth()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      const isLoginPage = pathname === '/login'

      if (!mounted) return

      if (event === 'INITIAL_SESSION') {
        if (!session && !isLoginPage) {
          router.replace('/login')
          return
        }

        if (session && isLoginPage) {
          router.replace('/dashboard')
          return
        }

        setCheckingAuth(false)
        return
      }

      if (!session && !isLoginPage) {
        router.replace('/login')
        return
      }

      if (session && isLoginPage) {
        router.replace('/dashboard')
        return
      }

      setCheckingAuth(false)
    })

    const fallback = setTimeout(() => {
      if (mounted) {
        setCheckingAuth(false)
      }
    }, 2500)

    return () => {
      mounted = false
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [pathname, router])

  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#334155',
          fontSize: '14px',
          fontWeight: 600
        }}
      >
        Carregando...
      </div>
    )
  }

  return <>{children}</>
}