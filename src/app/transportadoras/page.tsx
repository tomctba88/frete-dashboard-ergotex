'use client'

import { getPerfilAtual } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Transportadora = {
  id: number
  nome: string
}

export default function TransportadorasPage() {
  const [nome, setNome] = useState('')
  const [busca, setBusca] = useState('')
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
  const [editandoId, setEditandoId] = useState<number | null>(null)

  useEffect(() => {
    buscarTransportadoras()
  }, [])

  async function buscarTransportadoras() {
  const perfil = await getPerfilAtual()

  if (!perfil?.empresa_id) return

  const { data, error } = await supabase
    .from('transportadoras')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .order('id', { ascending: true })

  if (error) {
    console.error('Erro ao buscar transportadoras:', error)
    alert(error.message || 'Erro ao buscar transportadoras.')
    return
  }

  setTransportadoras(data || [])
}

async function salvarOuAtualizarTransportadora() {
  const perfil = await getPerfilAtual()

  if (!perfil?.empresa_id) {
    alert('Empresa do usuário não identificada.')
    return
  }

  if (!nome.trim()) {
    alert('Preencha o nome da transportadora.')
    return
  }

  if (editandoId) {
    const { error } = await supabase
      .from('transportadoras')
      .update({ nome: nome.trim() })
      .eq('id', editandoId)
      .eq('empresa_id', perfil.empresa_id)

    if (error) {
      console.error('Erro ao atualizar transportadora:', error)
      alert(error.message || 'Erro ao atualizar transportadora.')
      return
    }

    alert('Transportadora atualizada com sucesso!')
  } else {
    const { error } = await supabase
      .from('transportadoras')
      .insert([
        {
          nome: nome.trim(),
          empresa_id: perfil.empresa_id
        }
      ])

    if (error) {
      console.error('Erro ao salvar transportadora:', error)
      alert(error.message || 'Erro ao salvar transportadora.')
      return
    }

    alert('Transportadora cadastrada com sucesso!')
  }

  limparFormulario()
  buscarTransportadoras()
}
function editarTransportadora(transportadora: Transportadora) {
  setNome(transportadora.nome)
  setEditandoId(transportadora.id)
}

async function excluirTransportadora(id: number) {
  const perfil = await getPerfilAtual()

  if (!perfil?.empresa_id) {
    alert('Empresa do usuário não identificada.')
    return
  }

  const confirmar = confirm('Tem certeza que deseja excluir esta transportadora?')

  if (!confirmar) return

  const { error } = await supabase
    .from('transportadoras')
    .delete()
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)

  if (error) {
    console.error('Erro ao excluir transportadora:', error)
    alert(error.message || 'Erro ao excluir transportadora.')
    return
  }

  alert('Transportadora excluída com sucesso!')

  if (editandoId === id) {
    limparFormulario()
  }

  buscarTransportadoras()
}

function limparFormulario() {
  setNome('')
  setEditandoId(null)
}

  const transportadorasFiltradas = transportadoras.filter((transportadora) =>
    transportadora.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const th = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left' as const
  }

  const td = {
    border: '1px solid #ddd',
    padding: '8px'
  }

  const inputStyle = {
    padding: '8px',
    marginRight: '10px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px'
  }

  const buttonStyle = {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: '#111827',
    color: '#fff',
    marginRight: '8px'
  }

  const editButtonStyle = {
    padding: '6px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: '#2563eb',
    color: '#fff',
    marginRight: '6px'
  }

  const deleteButtonStyle = {
    padding: '6px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: '#dc2626',
    color: '#fff'
  }

  const cancelButtonStyle = {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: '#6b7280',
    color: '#fff'
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Cadastro de Transportadoras</h1>

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nome da transportadora"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={inputStyle}
        />

        <button onClick={salvarOuAtualizarTransportadora} style={buttonStyle}>
          {editandoId ? 'Atualizar Transportadora' : 'Salvar Transportadora'}
        </button>

        {editandoId && (
          <button onClick={limparFormulario} style={cancelButtonStyle}>
            Cancelar Edição
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Buscar transportadora..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{
          padding: '8px',
          marginBottom: '15px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          width: '300px'
        }}
      />

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={th}>ID</th>
            <th style={th}>Nome</th>
            <th style={th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {transportadorasFiltradas.map((transportadora) => (
            <tr key={transportadora.id}>
              <td style={td}>{transportadora.id}</td>
              <td style={td}>{transportadora.nome}</td>
              <td style={td}>
                <button
                  onClick={() => editarTransportadora(transportadora)}
                  style={editButtonStyle}
                >
                  Editar
                </button>

                <button
                  onClick={() => excluirTransportadora(transportadora.id)}
                  style={deleteButtonStyle}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}