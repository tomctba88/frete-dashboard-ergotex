'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Estado = {
  id: number
  nome: string
  uf: string
}

type Cidade = {
  id: number
  nome: string
  estado_id: number
  estados?:
    | {
        nome: string
        uf: string
      }
    | {
        nome: string
        uf: string
      }[]
}

export default function CidadesPage() {
  const [nomeCidade, setNomeCidade] = useState('')
  const [estadoId, setEstadoId] = useState('')
  const [estados, setEstados] = useState<Estado[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [busca, setBusca] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)

  useEffect(() => {
    buscarEstados()
    buscarCidades()
  }, [])

  async function buscarEstados() {
    const { data, error } = await supabase
      .from('estados')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar estados:', error)
      return
    }

    setEstados(data || [])
  }

  async function buscarCidades() {
    const { data, error } = await supabase
      .from('cidades')
      .select(`
        id,
        nome,
        estado_id,
        estados (
          nome,
          uf
        )
      `)
      .order('id', { ascending: true })

    if (error) {
      console.error('Erro ao buscar cidades:', error)
      return
    }

    setCidades((data || []) as Cidade[])
  }

  async function salvarOuAtualizarCidade() {
    if (!nomeCidade || !estadoId) {
      alert('Preencha o nome da cidade e selecione o estado.')
      return
    }

    if (editandoId) {
      const { error } = await supabase
        .from('cidades')
        .update({
          nome: nomeCidade,
          estado_id: Number(estadoId)
        })
        .eq('id', editandoId)

      if (error) {
        console.error('Erro ao atualizar cidade:', error)
        alert('Erro ao atualizar cidade.')
        return
      }

      alert('Cidade atualizada com sucesso!')
    } else {
      const { error } = await supabase.from('cidades').insert([
        {
          nome: nomeCidade,
          estado_id: Number(estadoId)
        }
      ])

      if (error) {
        console.error('Erro ao salvar cidade:', error)
        alert('Erro ao salvar cidade.')
        return
      }

      alert('Cidade cadastrada com sucesso!')
    }

    limparFormulario()
    buscarCidades()
  }

  function editarCidade(cidade: Cidade) {
    setNomeCidade(cidade.nome)
    setEstadoId(String(cidade.estado_id))
    setEditandoId(cidade.id)
  }

  async function excluirCidade(id: number) {
    const confirmar = confirm('Tem certeza que deseja excluir esta cidade?')
    if (!confirmar) return

    const { error } = await supabase
      .from('cidades')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir cidade:', error)
      alert('Erro ao excluir cidade.')
      return
    }

    alert('Cidade excluída com sucesso!')

    if (editandoId === id) {
      limparFormulario()
    }

    buscarCidades()
  }

  function limparFormulario() {
    setNomeCidade('')
    setEstadoId('')
    setEditandoId(null)
  }

  function obterNomeEstado(cidade: Cidade) {
    if (Array.isArray(cidade.estados)) {
      return cidade.estados[0]?.nome || '-'
    }

    return cidade.estados?.nome || '-'
  }

  function obterUfEstado(cidade: Cidade) {
    if (Array.isArray(cidade.estados)) {
      return cidade.estados[0]?.uf || '-'
    }

    return cidade.estados?.uf || '-'
  }

  const cidadesFiltradas = cidades.filter((cidade) => {
    const texto = busca.toLowerCase()

    return (
      cidade.nome.toLowerCase().includes(texto) ||
      obterNomeEstado(cidade).toLowerCase().includes(texto) ||
      obterUfEstado(cidade).toLowerCase().includes(texto)
    )
  })

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
      <h1>Cadastro de Cidades</h1>

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nome da cidade"
          value={nomeCidade}
          onChange={(e) => setNomeCidade(e.target.value)}
          style={inputStyle}
        />

        <select
          value={estadoId}
          onChange={(e) => setEstadoId(e.target.value)}
          style={inputStyle}
        >
          <option value="">Selecione o estado</option>
          {estados.map((estado) => (
            <option key={estado.id} value={estado.id}>
              {estado.nome} - {estado.uf}
            </option>
          ))}
        </select>

        <button onClick={salvarOuAtualizarCidade} style={buttonStyle}>
          {editandoId ? 'Atualizar Cidade' : 'Salvar Cidade'}
        </button>

        {editandoId && (
          <button onClick={limparFormulario} style={cancelButtonStyle}>
            Cancelar Edição
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Buscar cidade, estado ou UF..."
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
            <th style={th}>Cidade</th>
            <th style={th}>Estado</th>
            <th style={th}>UF</th>
            <th style={th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {cidadesFiltradas.map((cidade) => (
            <tr key={cidade.id}>
              <td style={td}>{cidade.id}</td>
              <td style={td}>{cidade.nome}</td>
              <td style={td}>{obterNomeEstado(cidade)}</td>
              <td style={td}>{obterUfEstado(cidade)}</td>
              <td style={td}>
                <button
                  onClick={() => editarCidade(cidade)}
                  style={editButtonStyle}
                >
                  Editar
                </button>

                <button
                  onClick={() => excluirCidade(cidade.id)}
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