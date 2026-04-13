'use client'

import { useEffect, useMemo, useState } from 'react'
import { getPerfilAtual } from '@/lib/auth'

type PerfilSistema = 'admin' | 'operacional' | 'consulta'

type Usuario = {
  id: string
  user_id: string
  empresa_id: string
  nome: string | null
  email: string | null
  perfil: PerfilSistema
  ativo: boolean
}

export default function UsuariosPage() {
  const [perfilAtual, setPerfilAtual] = useState<{
    empresa_id: string
    perfil: PerfilSistema
  } | null>(null)

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [perfil, setPerfil] = useState<PerfilSistema>('operacional')

  const [busca, setBusca] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editPerfil, setEditPerfil] = useState<PerfilSistema>('operacional')

  useEffect(() => {
    iniciar()
  }, [])

  async function iniciar() {
    setLoading(true)

    const perfilLogado = await getPerfilAtual()

    if (!perfilLogado) {
      alert('Usuário não identificado.')
      setLoading(false)
      return
    }

    if (perfilLogado.perfil !== 'admin') {
      alert('Apenas administradores podem acessar esta página.')
      window.location.href = '/'
      return
    }

    setPerfilAtual({
      empresa_id: perfilLogado.empresa_id,
      perfil: perfilLogado.perfil
    })

    await buscarUsuarios(perfilLogado.empresa_id)
    setLoading(false)
  }

  async function buscarUsuarios(empresaIdParam?: string) {
    const empresaId = empresaIdParam || perfilAtual?.empresa_id

    if (!empresaId) return

    const response = await fetch(`/api/usuarios?empresa_id=${empresaId}`)
    const resultado = await response.json()

    if (!response.ok) {
      console.error(resultado)
      alert(resultado.error || 'Erro ao buscar usuários.')
      return
    }

    setUsuarios(resultado.usuarios || [])
  }

  async function cadastrarUsuario() {
    if (!perfilAtual?.empresa_id) {
      alert('Empresa do administrador não identificada.')
      return
    }

    if (!nome || !email || !senha || !perfil) {
      alert('Preencha nome, e-mail, senha e perfil.')
      return
    }

    try {
      setSalvando(true)

      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          password: senha,
          perfil,
          empresa_id: perfilAtual.empresa_id
        })
      })

      const resultado = await response.json()

      if (!response.ok) {
        console.error(resultado)
        alert(resultado.error || 'Erro ao cadastrar usuário.')
        return
      }

      alert('Usuário cadastrado com sucesso!')

      setNome('')
      setEmail('')
      setSenha('')
      setPerfil('operacional')

      await buscarUsuarios()
    } catch (error) {
      console.error(error)
      alert('Erro ao cadastrar usuário.')
    } finally {
      setSalvando(false)
    }
  }

  function iniciarEdicao(usuario: Usuario) {
    setEditandoId(usuario.id)
    setEditNome(usuario.nome || '')
    setEditPerfil(usuario.perfil)
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setEditNome('')
    setEditPerfil('operacional')
  }

  async function salvarEdicao(id: string) {
    if (!editNome.trim()) {
      alert('Informe o nome do usuário.')
      return
    }

    try {
      setSalvando(true)

      const response = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          nome: editNome.trim(),
          perfil: editPerfil
        })
      })

      const resultado = await response.json()

      if (!response.ok) {
        console.error(resultado)
        alert(resultado.error || 'Erro ao atualizar usuário.')
        return
      }

      alert('Usuário atualizado com sucesso!')
      cancelarEdicao()
      await buscarUsuarios()
    } catch (error) {
      console.error(error)
      alert('Erro ao atualizar usuário.')
    } finally {
      setSalvando(false)
    }
  }

  async function alternarStatus(usuario: Usuario) {
    const acao = usuario.ativo ? 'desativar' : 'ativar'
    const confirmar = confirm(`Deseja realmente ${acao} este usuário?`)

    if (!confirmar) return

    try {
      setSalvando(true)

      const response = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: usuario.id,
          ativo: !usuario.ativo
        })
      })

      const resultado = await response.json()

      if (!response.ok) {
        console.error(resultado)
        alert(resultado.error || 'Erro ao atualizar status.')
        return
      }

      alert(`Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso!`)
      await buscarUsuarios()
    } catch (error) {
      console.error(error)
      alert('Erro ao atualizar status.')
    } finally {
      setSalvando(false)
    }
  }

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim()

    if (!termo) return usuarios

    return usuarios.filter((usuario) => {
      return (
        (usuario.nome || '').toLowerCase().includes(termo) ||
        (usuario.email || '').toLowerCase().includes(termo) ||
        usuario.perfil.toLowerCase().includes(termo)
      )
    })
  }, [usuarios, busca])

  const pageStyle: React.CSSProperties = {
    padding: '24px',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
    minHeight: '100vh'
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '1500px',
    margin: '0 auto'
  }

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
    marginBottom: '20px'
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '46px',
    borderRadius: '12px',
    border: '1px solid #dbe2ea',
    padding: '0 12px',
    fontSize: '14px',
    background: '#fff',
    boxSizing: 'border-box'
  }

  const th: React.CSSProperties = {
    padding: '14px 12px',
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
    background: '#f8fafc',
    fontSize: '14px',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  }

  const td: React.CSSProperties = {
    padding: '14px 12px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px',
    verticalAlign: 'middle'
  }

  const primaryButton: React.CSSProperties = {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '12px',
    background: '#0f172a',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700
  }

  const blueButton: React.CSSProperties = {
    padding: '10px 14px',
    border: 'none',
    borderRadius: '10px',
    background: '#2563eb',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    marginRight: '8px'
  }

  const grayButton: React.CSSProperties = {
    padding: '10px 14px',
    border: 'none',
    borderRadius: '10px',
    background: '#6b7280',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    marginRight: '8px'
  }

  const redButton: React.CSSProperties = {
    padding: '10px 14px',
    border: 'none',
    borderRadius: '10px',
    background: '#dc2626',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700
  }

  const greenButton: React.CSSProperties = {
    padding: '10px 14px',
    border: 'none',
    borderRadius: '10px',
    background: '#16a34a',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700
  }

  const badge = (ativo: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    background: ativo ? '#dcfce7' : '#fee2e2',
    color: ativo ? '#166534' : '#991b1b'
  })

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>Carregando usuários...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1
          style={{
            fontSize: '30px',
            marginBottom: '20px',
            color: '#111827',
            fontWeight: 800
          }}
        >
          Usuários
        </h1>

        <div style={cardStyle}>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#111827',
              marginBottom: '18px'
            }}
          >
            Cadastrar novo usuário
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 2fr 2fr auto',
              gap: '14px',
              alignItems: 'end'
            }}
          >
            <input
              type='text'
              placeholder='Nome'
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={inputStyle}
            />

            <input
              type='email'
              placeholder='E-mail'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <input
              type='text'
              placeholder='Senha inicial'
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={inputStyle}
            />

            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as PerfilSistema)}
              style={inputStyle}
            >
              <option value='admin'>Admin</option>
              <option value='operacional'>Operacional</option>
              <option value='consulta'>Consulta</option>
            </select>

            <button
              onClick={cadastrarUsuario}
              disabled={salvando}
              style={primaryButton}
            >
              {salvando ? 'Salvando...' : 'Cadastrar usuário'}
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '18px'
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#111827'
              }}
            >
              Usuários cadastrados
            </div>

            <input
              type='text'
              placeholder='Buscar por nome, e-mail ou perfil'
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ ...inputStyle, maxWidth: '340px' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th style={th}>Nome</th>
                  <th style={th}>E-mail</th>
                  <th style={th}>Perfil</th>
                  <th style={th}>Status</th>
                  <th style={th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => {
                  const estaEditando = editandoId === usuario.id

                  return (
                    <tr key={usuario.id}>
                      <td style={td}>
                        {estaEditando ? (
                          <input
                            type='text'
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            style={inputStyle}
                          />
                        ) : (
                          usuario.nome || '-'
                        )}
                      </td>

                      <td style={td}>{usuario.email || '-'}</td>

                      <td style={td}>
                        {estaEditando ? (
                          <select
                            value={editPerfil}
                            onChange={(e) => setEditPerfil(e.target.value as PerfilSistema)}
                            style={inputStyle}
                          >
                            <option value='admin'>admin</option>
                            <option value='operacional'>operacional</option>
                            <option value='consulta'>consulta</option>
                          </select>
                        ) : (
                          usuario.perfil
                        )}
                      </td>

                      <td style={td}>
                        <span style={badge(usuario.ativo)}>
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td style={td}>
                        {estaEditando ? (
                          <>
                            <button
                              onClick={() => salvarEdicao(usuario.id)}
                              style={greenButton}
                            >
                              Salvar
                            </button>
                            <button
                              onClick={cancelarEdicao}
                              style={grayButton}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => iniciarEdicao(usuario)}
                              style={blueButton}
                            >
                              Editar
                            </button>

                            <button
                              onClick={() => alternarStatus(usuario)}
                              style={usuario.ativo ? redButton : greenButton}
                            >
                              {usuario.ativo ? 'Desativar' : 'Ativar'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {!usuariosFiltrados.length && (
                  <tr>
                    <td style={td} colSpan={5}>
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
