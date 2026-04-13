'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getPerfilAtual } from '@/lib/auth'

type PerfilAtual = {
  id: string
  user_id: string
  empresa_id: string
  nome: string | null
  email: string | null
  perfil: 'admin' | 'operacional' | 'consulta'
  ativo: boolean
}

type Empresa = {
  id: string
  nome: string
}

export default function PerfilPage() {
  const [perfilAtual, setPerfilAtual] = useState<PerfilAtual | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [nome, setNome] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  useEffect(() => {
    carregarPerfil()
  }, [])

  async function carregarPerfil() {
    try {
      setLoading(true)

      const perfil = await getPerfilAtual()

      if (!perfil) {
        alert('Usuário não identificado.')
        return
      }

      setPerfilAtual(perfil)
      setNome(perfil.nome || '')

      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('id', perfil.empresa_id)
        .maybeSingle()

      if (empresaError) {
        console.error('Erro ao buscar empresa:', empresaError)
      } else {
        setEmpresa(empresaData || null)
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      alert('Erro ao carregar perfil.')
    } finally {
      setLoading(false)
    }
  }

  async function salvarNome() {
    if (!perfilAtual) {
      alert('Usuário não identificado.')
      return
    }

    if (!nome.trim()) {
      alert('Informe seu nome.')
      return
    }

    try {
      setSalvandoNome(true)

      const { error } = await supabase
        .from('perfis')
        .update({
          nome: nome.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', perfilAtual.id)

      if (error) {
        console.error('Erro ao atualizar nome:', error)
        alert('Erro ao atualizar nome.')
        return
      }

      alert('Nome atualizado com sucesso!')
      await carregarPerfil()
    } catch (error) {
      console.error('Erro ao atualizar nome:', error)
      alert('Erro ao atualizar nome.')
    } finally {
      setSalvandoNome(false)
    }
  }

  async function alterarSenha() {
    if (!novaSenha || !confirmarSenha) {
      alert('Preencha a nova senha e a confirmação.')
      return
    }

    if (novaSenha.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (novaSenha !== confirmarSenha) {
      alert('A confirmação da senha não confere.')
      return
    }

    try {
      setSalvandoSenha(true)

      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      })

      if (error) {
        console.error('Erro ao alterar senha:', error)
        alert('Erro ao alterar senha.')
        return
      }

      alert('Senha alterada com sucesso!')
      setNovaSenha('')
      setConfirmarSenha('')
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      alert('Erro ao alterar senha.')
    } finally {
      setSalvandoSenha(false)
    }
  }

  const pageStyle: React.CSSProperties = {
    padding: '24px',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
    minHeight: '100vh'
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '1100px',
    margin: '0 auto'
  }

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '30px',
    marginBottom: '8px',
    color: '#111827',
    fontWeight: 800
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px'
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 800,
    color: '#111827',
    marginBottom: '18px'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: '6px'
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '44px',
    borderRadius: '12px',
    border: '1px solid #dbe2ea',
    padding: '0 12px',
    fontSize: '14px',
    color: '#0f172a',
    background: '#fff',
    outline: 'none'
  }

  const readonlyBoxStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '44px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '12px',
    fontSize: '14px',
    color: '#0f172a',
    background: '#f8fafc',
    boxSizing: 'border-box'
  }

  const primaryButtonStyle: React.CSSProperties = {
    height: '44px',
    padding: '0 18px',
    borderRadius: '12px',
    border: 'none',
    background: '#111827',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
  }

  const secondaryButtonStyle: React.CSSProperties = {
    height: '44px',
    padding: '0 18px',
    borderRadius: '12px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>Carregando perfil...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Meu Perfil</h1>
        <div style={subtitleStyle}>
          Gerencie seus dados de acesso e informações do usuário logado.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: '20px'
          }}
        >
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Informações da conta</div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px'
              }}
            >
              <div>
                <label style={labelStyle}>Nome</label>
                <input
                  type='text'
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>E-mail</label>
                <div style={readonlyBoxStyle}>{perfilAtual?.email || '-'}</div>
              </div>

              <div>
                <label style={labelStyle}>Perfil</label>
                <div style={readonlyBoxStyle}>{perfilAtual?.perfil || '-'}</div>
              </div>

              <div>
                <label style={labelStyle}>Empresa</label>
                <div style={readonlyBoxStyle}>{empresa?.nome || '-'}</div>
              </div>
            </div>

            <div style={{ marginTop: '18px' }}>
              <button
                onClick={salvarNome}
                style={primaryButtonStyle}
                disabled={salvandoNome}
              >
                {salvandoNome ? 'Salvando...' : 'Salvar nome'}
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Alterar senha</div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px'
              }}
            >
              <div>
                <label style={labelStyle}>Nova senha</label>
                <input
                  type='password'
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Confirmar nova senha</label>
                <input
                  type='password'
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: '18px' }}>
              <button
                onClick={alterarSenha}
                style={secondaryButtonStyle}
                disabled={salvandoSenha}
              >
                {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
