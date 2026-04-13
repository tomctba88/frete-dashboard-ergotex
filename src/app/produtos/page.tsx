'use client'

import { getPerfilAtual, type PerfilUsuario } from '@/lib/auth'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Produto = {
  id: number
  nome: string
  largura: number | null
  comprimento: number | null
  altura: number | null
  peso: number | null
  empresa_id?: string | null
}

export default function ProdutosPage() {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null)
  const [loadingPerfil, setLoadingPerfil] = useState(true)
  const [loadingProdutos, setLoadingProdutos] = useState(false)

  const [nome, setNome] = useState('')
  const [largura, setLargura] = useState('')
  const [comprimento, setComprimento] = useState('')
  const [altura, setAltura] = useState('')
  const [peso, setPeso] = useState('')
  const [busca, setBusca] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [editandoId, setEditandoId] = useState<number | null>(null)

  useEffect(() => {
    carregarPerfil()
  }, [])

  useEffect(() => {
    if (perfil?.empresa_id) {
      buscarProdutos(perfil.empresa_id)
    }
  }, [perfil])

  async function carregarPerfil() {
    setLoadingPerfil(true)

    const perfilAtual = await getPerfilAtual()

    if (!perfilAtual) {
      alert('Perfil do usuário não encontrado.')
      setLoadingPerfil(false)
      return
    }

    if (!perfilAtual.ativo) {
      alert('Seu usuário está inativo.')
      setLoadingPerfil(false)
      return
    }

    setPerfil(perfilAtual)
    setLoadingPerfil(false)
  }

  async function buscarProdutos(empresaIdParam?: string) {
    const empresaId = empresaIdParam || perfil?.empresa_id

    if (!empresaId) {
      return
    }

    setLoadingProdutos(true)

    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, largura, comprimento, altura, peso, empresa_id')
      .eq('empresa_id', empresaId)
      .order('id', { ascending: true })

    setLoadingProdutos(false)

    if (error) {
      console.error('Erro ao buscar produtos:', error)
      alert('Erro ao buscar produtos. Verifique as policies da tabela produtos.')
      return
    }

    setProdutos(data || [])
  }

  async function salvarOuAtualizarProduto() {
  if (!perfil?.empresa_id) {
    alert('Empresa do usuário não identificada.')
    return
  }

  if (!nome || !largura || !comprimento || !altura) {
    alert('Preencha nome, largura, comprimento e altura.')
    return
  }

  const payload = {
    nome: nome.trim(),
    largura: Number(largura.replace(',', '.')),
    comprimento: Number(comprimento.replace(',', '.')),
    altura: Number(altura.replace(',', '.')),
    peso: peso ? Number(peso.replace(',', '.')) : null,
    empresa_id: perfil.empresa_id
  }

  if (editandoId) {
    const { error } = await supabase
      .from('produtos')
      .update(payload)
      .eq('id', editandoId)
      .eq('empresa_id', perfil.empresa_id)

    if (error) {
      console.error('Erro ao atualizar produto:', error)
      alert(error.message || 'Erro ao atualizar produto.')
      return
    }

    alert('Produto atualizado com sucesso!')
  } else {
    const { error } = await supabase
      .from('produtos')
      .insert([payload])

    if (error) {
      console.error('Erro ao salvar produto:', error)
      alert(error.message || 'Erro ao salvar produto.')
      return
    }

    alert('Produto cadastrado com sucesso!')
  }

  limparFormulario()
  buscarProdutos()
}

  function editarProduto(produto: Produto) {
    setNome(produto.nome)
    setLargura(produto.largura != null ? String(produto.largura) : '')
    setComprimento(produto.comprimento != null ? String(produto.comprimento) : '')
    setAltura(produto.altura != null ? String(produto.altura) : '')
    setPeso(produto.peso != null ? String(produto.peso) : '')
    setEditandoId(produto.id)
  }

  async function excluirProduto(id: number) {
    if (!perfil?.empresa_id) {
      alert('Empresa do usuário não identificada.')
      return
    }

    const confirmar = confirm('Tem certeza que deseja excluir este produto?')

    if (!confirmar) return

    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
      .eq('empresa_id', perfil.empresa_id)

    if (error) {
  console.error('Erro ao excluir produto:', error)
  alert(error.message || 'Erro ao excluir produto.')
  return
}

    alert('Produto excluído com sucesso!')

    if (editandoId === id) {
      limparFormulario()
    }

    buscarProdutos()
  }

  function limparFormulario() {
    setNome('')
    setLargura('')
    setComprimento('')
    setAltura('')
    setPeso('')
    setEditandoId(null)
  }

  function calcularCubagemM3(produto: Produto) {
    const l = Number(produto.largura || 0)
    const c = Number(produto.comprimento || 0)
    const a = Number(produto.altura || 0)

    return (l / 1000) * (c / 1000) * (a / 1000)
  }

  function formatarNumeroBR(valor: number, casas = 2) {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas
    })
  }

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) =>
      produto.nome.toLowerCase().includes(busca.toLowerCase())
    )
  }, [produtos, busca])

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
      <h1>Cadastro de Produtos</h1>

      <div style={{ marginBottom: 12, color: '#64748b' }}>
        {loadingPerfil
          ? 'Carregando perfil...'
          : perfil
          ? `Empresa ativa: ${perfil.empresa_id}`
          : 'Perfil não carregado'}
      </div>

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nome do produto"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Largura (mm)"
          value={largura}
          onChange={(e) => setLargura(e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Comprimento (mm)"
          value={comprimento}
          onChange={(e) => setComprimento(e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Altura (mm)"
          value={altura}
          onChange={(e) => setAltura(e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Peso (kg)"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          style={inputStyle}
        />

        <button onClick={salvarOuAtualizarProduto} style={buttonStyle}>
          {editandoId ? 'Atualizar Produto' : 'Salvar Produto'}
        </button>

        {editandoId && (
          <button onClick={limparFormulario} style={cancelButtonStyle}>
            Cancelar Edição
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Buscar produto..."
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

      <div style={{ marginBottom: 12, color: '#64748b' }}>
        {loadingProdutos
          ? 'Carregando produtos...'
          : `${produtosFiltrados.length} produto(s) exibido(s).`}
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={th}>ID</th>
            <th style={th}>Nome</th>
            <th style={th}>Largura (mm)</th>
            <th style={th}>Comprimento (mm)</th>
            <th style={th}>Altura (mm)</th>
            <th style={th}>Peso (kg)</th>
            <th style={th}>Cubagem Unitária (m³)</th>
            <th style={th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtosFiltrados.map((produto) => (
            <tr key={produto.id}>
              <td style={td}>{produto.id}</td>
              <td style={td}>{produto.nome}</td>
              <td style={td}>
                {produto.largura != null ? formatarNumeroBR(produto.largura, 0) : '-'}
              </td>
              <td style={td}>
                {produto.comprimento != null ? formatarNumeroBR(produto.comprimento, 0) : '-'}
              </td>
              <td style={td}>
                {produto.altura != null ? formatarNumeroBR(produto.altura, 0) : '-'}
              </td>
              <td style={td}>
                {produto.peso != null ? formatarNumeroBR(produto.peso, 2) : '-'}
              </td>
              <td style={td}>
                {formatarNumeroBR(calcularCubagemM3(produto), 4)} m³
              </td>
              <td style={td}>
                <button
                  onClick={() => editarProduto(produto)}
                  style={editButtonStyle}
                >
                  Editar
                </button>

                <button
                  onClick={() => excluirProduto(produto.id)}
                  style={deleteButtonStyle}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}

          {!loadingProdutos && produtosFiltrados.length === 0 && (
            <tr>
              <td style={td} colSpan={8}>
                Nenhum produto encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
