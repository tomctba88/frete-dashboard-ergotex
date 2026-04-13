'use client'

import BotaoLogout from '@/components/BotaoLogout'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Menu() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [perfil, setPerfil] = useState<string>('')

  useEffect(() => {
    buscarPerfil()
  }, [])

  async function buscarPerfil() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData?.user?.id) {
        return
      }

      const { data, error } = await supabase
        .from('perfis')
        .select('perfil')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar perfil do menu:', error)
        return
      }

      if (data?.perfil) {
        setPerfil(data.perfil)
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do menu:', error)
    }
  }

  if (pathname === '/login') {
    return null
  }

  const links = useMemo(() => {
    const baseLinks = [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/lancamentos', label: 'Lançamentos' },
      { href: '/produtos', label: 'Produtos' },
      { href: '/transportadoras', label: 'Transportadoras' },
      { href: '/cidades', label: 'Cidades' },
      { href: '/resultados', label: 'Resultados' },
      { href: '/perfil', label: 'Perfil' }
    ]

    if (perfil === 'admin') {
      return [
        ...baseLinks.slice(0, 6),
        { href: '/usuarios', label: 'Usuários' },
        baseLinks[6]
      ]
    }

    return baseLinks
  }, [perfil])

  function isActive(href: string) {
    return pathname === href
  }

  return (
    <>
      <header className="topbar">
        <div className="logo">Frete Dashboard</div>

        <nav className="menu-desktop">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? 'link active' : 'link'}
            >
              {link.label}
            </Link>
          ))}

          <BotaoLogout />
        </nav>

        <button
          className="hamburger"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
        >
          ☰
        </button>
      </header>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <aside className={open ? 'mobile-menu open' : 'mobile-menu'}>
        <div className="mobile-header">
          <strong>Menu</strong>
          <button
            className="close-btn"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={isActive(link.href) ? 'mobile-link active' : 'mobile-link'}
          >
            {link.label}
          </Link>
        ))}

        <div className="mobile-logout">
          <BotaoLogout />
        </div>
      </aside>

      <style jsx>{`
        .topbar {
          height: 64px;
          background: #0f172a;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.18);
        }

        .logo {
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.2px;
        }

        .menu-desktop {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .link {
          color: #cbd5e1;
          text-decoration: none;
          font-size: 14px;
          padding: 8px 10px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .link:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
        }

        .link.active {
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
          font-weight: 600;
        }

        .hamburger {
          display: none;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 24px;
          cursor: pointer;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 90;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: -280px;
          width: 260px;
          height: 100%;
          background: #fff;
          z-index: 100;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: right 0.3s ease;
          box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
        }

        .mobile-menu.open {
          right: 0;
        }

        .mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .close-btn {
          border: none;
          background: transparent;
          font-size: 20px;
          cursor: pointer;
        }

        .mobile-link {
          text-decoration: none;
          color: #1e293b;
          font-size: 15px;
          padding: 10px;
          border-radius: 8px;
        }

        .mobile-link.active {
          background: #eef2ff;
          font-weight: 600;
        }

        .mobile-logout {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .menu-desktop {
            display: none;
          }

          .hamburger {
            display: block;
          }
        }
      `}</style>
    </>
  )
}
