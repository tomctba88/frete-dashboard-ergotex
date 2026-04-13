'use client'

import { getPerfilAtual } from '@/lib/auth'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Produto = {
  id: number
  nome: string
  largura: number | null
  comprimento: number | null
  altura: number | null
  peso: number | null
}

type Transportadora = {
  id: number
  nome: string
}

type Estado = {
  id: number
  nome: string
  uf: string
}

type Cidade = {
  id: number
  nome: string
  estado_id: number
}

type Lancamento = {
  id: number
  quantidade: number
  valor_frete: number
  data: string
  produto_id: number
  transportadora_id: number
  cidade_id: number
  prazo_entrega: number | null
}

export default function LancamentosPage() {
  const [produtoId, setProdutoId] = useState('')
  const [transportadoraId, setTransportadoraId] = useState('')
  const [estadoId, setEstadoId] = useState('')
  const [cidadeId, setCidadeId] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [valorFrete, setValorFrete] = useState('')
  const [prazoEntrega, setPrazoEntrega] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)

  const [buscaProduto, setBuscaProduto] = useState('')
  const [buscaTransportadora, setBuscaTransportadora] = useState('')
  const [buscaCidade, setBuscaCidade] = useState('')

  const [buscaLista, setBuscaLista] = useState('')
  const [filtroProdutoLista, setFiltroProdutoLista] = useState('')
  const [filtroTransportadoraLista, setFiltroTransportadoraLista] = useState('')
  const [dataInicialLista, setDataInicialLista] = useState('')
  const [dataFinalLista, setDataFinalLista] = useState('')

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [cidadesFiltradas, setCidadesFiltradas] = useState<Cidade[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])

  useEffect(() => {
    buscarProdutos()
    buscarTransportadoras()
    buscarEstados()
    buscarCidades()
    buscarLancamentos()
  }, [])

  useEffect(() => {
    if (!estadoId) {
      setCidadesFiltradas([])
      setCidadeId('')
      setBuscaCidade('')
      return
    }

    const filtradas = cidades.filter(
      (cidade) => String(cidade.estado_id) === estadoId
    )

    setCidadesFiltradas(filtradas)

    if (!filtradas.find((cidade) => String(cidade.id) === cidadeId)) {
      setCidadeId('')
      setBuscaCidade('')
    }
  }, [estadoId, cidades, cidadeId])

  async function buscarProdutos() {
    const perfil = await getPerfilAtual()

    if (!perfil?.empresa_id) return

    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('empresa_id', perfil.empresa_id)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar produtos:', error)
      alert(error.message || 'Erro ao buscar produtos.')
      return
    }

    setProdutos(data || [])
  }

  async function buscarTransportadoras() {
    const perfil = await getPerfilAtual()

    if (!perfil?.empresa_id) return

    const { data, error } = await supabase
      .from('transportadoras')
      .select('*')
      .eq('empresa_id', perfil.empresa_id)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar transportadoras:', error)
      alert(error.message || 'Erro ao buscar transportadoras.')
      return
    }

    setTransportadoras(data || [])
  }

  async function buscarEstados() {
    const { data, error } = await supabase
      .from('estados')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar estados:', error)
      alert(error.message || 'Erro ao buscar estados.')
      return
    }

    setEstados(data || [])
  }

  async function buscarCidades() {
    const { data, error } = await supabase
      .from('cidades')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar cidades:', error)
      alert(error.message || 'Erro ao buscar cidades.')
      return
    }

    setCidades(data || [])
  }

  async function buscarLancamentos() {
    const perfil = await getPerfilAtual()

    if (!perfil?.empresa_id) return

    const { data, error } = await supabase
      .from('lancamentos_frete')
      .select('*')
      .eq('empresa_id', perfil.empresa_id)
      .order('id', { ascending: false })

    if (error) {
      console.error('Erro ao buscar lançamentos:', error)
      alert(error.message || 'Erro ao buscar lançamentos.')
      return
    }

    setLancamentos(data || [])
  }

  async function salvarOuAtualizarLancamento() {
    if (
      !produtoId ||
      !transportadoraId ||
      !estadoId ||
      !cidadeId ||
      !quantidade ||
      !valorFrete
    ) {
      alert('Preencha todos os campos obrigatórios.')
      return
    }

    const perfil = await getPerfilAtual()

    if (!perfil?.empresa_id) {
      alert('Usuário não identificado.')
      return
    }

    const payload = {
      produto_id: Number(produtoId),
      transportadora_id: Number(transportadoraId),
      cidade_id: Number(cidadeId),
      quantidade: Number(quantidade),
      valor_frete: Number(valorFrete.replace(',', '.')),
      prazo_entrega: prazoEntrega ? Number(prazoEntrega) : null
    }

    if (editandoId) {
      const { error } = await supabase
        .from('lancamentos_frete')
        .update(payload)
        .eq('id', editandoId)
        .eq('empresa_id', perfil.empresa_id)

      if (error) {
        console.error('Erro ao atualizar lançamento:', error)
        alert(error.message || 'Erro ao atualizar lançamento.')
        return
      }

      alert('Lançamento atualizado com sucesso!')
    } else {
      const { error } = await supabase
        .from('lancamentos_frete')
        .insert([
          {
            ...payload,
            empresa_id: perfil.empresa_id
          }
        ])

      if (error) {
        console.error('Erro ao salvar lançamento:', error)
        alert(error.message || 'Erro ao salvar lançamento.')
        return
      }

      alert('Lançamento salvo com sucesso!')
    }

    limparFormulario()
    buscarLancamentos()
  }

  function editarLancamento(lancamento: Lancamento) {
    setEditandoId(lancamento.id)
    setProdutoId(String(lancamento.produto_id))
    setTransportadoraId(String(lancamento.transportadora_id))
    setCidadeId(String(lancamento.cidade_id))
    setQuantidade(String(lancamento.quantidade))
    setValorFrete(String(lancamento.valor_frete))
    setPrazoEntrega(
      lancamento.prazo_entrega != null ? String(lancamento.prazo_entrega) : ''
    )

    const cidade = cidades.find((c) => c.id === lancamento.cidade_id)
    if (cidade) {
      setEstadoId(String(cidade.estado_id))
    }

    setBuscaProduto('')
    setBuscaTransportadora('')
    setBuscaCidade('')
  }

  async function excluirLancamento(id: number) {
    const perfil = await getPerfilAtual()

    if (!perfil?.empresa_id) {
      alert('Usuário não identificado.')
      return
    }

    const confirmar = confirm('Tem certeza que deseja excluir este lançamento?')
    if (!confirmar) return

    const { error } = await supabase
      .from('lancamentos_frete')
      .delete()
      .eq('id', id)
      .eq('empresa_id', perfil.empresa_id)

    if (error) {
      console.error('Erro ao excluir lançamento:', error)
      alert(error.message || 'Erro ao excluir lançamento.')
      return
    }

    alert('Lançamento excluído com sucesso!')

    if (editandoId === id) {
      limparFormulario()
    }

    buscarLancamentos()
  }

  function limparFormulario() {
    setProdutoId('')
    setTransportadoraId('')
    setEstadoId('')
    setCidadeId('')
    setQuantidade('')
    setValorFrete('')
    setPrazoEntrega('')
    setBuscaProduto('')
    setBuscaTransportadora('')
    setBuscaCidade('')
    setEditandoId(null)
  }

  function formatarMoeda(valor: number | string) {
    const numero = typeof valor === 'string' ? Number(valor.replace(',', '.')) : valor

    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  function formatarNumero(valor: number, casas = 2) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas
    })
  }

  function nomeProdutoSelecionado() {
    return produtos.find((p) => String(p.id) === produtoId)?.nome || buscaProduto
  }

  function nomeTransportadoraSelecionada() {
    return (
      transportadoras.find((t) => String(t.id) === transportadoraId)?.nome ||
      buscaTransportadora
    )
  }

  function nomeCidadeSelecionada() {
    return cidadesFiltradas.find((c) => String(c.id) === cidadeId)?.nome || buscaCidade
  }

  function buscarProduto(id: number) {
    return produtos.find((produto) => produto.id === id) || null
  }

  function buscarNomeProduto(id: number) {
    return buscarProduto(id)?.nome || '-'
  }

  function buscarNomeTransportadora(id: number) {
    return transportadoras.find((transportadora) => transportadora.id === id)?.nome || '-'
  }

  function buscarNomeCidade(id: number) {
    return cidades.find((cidade) => cidade.id === id)?.nome || '-'
  }

  const produtoSelecionado = useMemo(() => {
    return produtos.find((p) => String(p.id) === produtoId) || null
  }, [produtoId, produtos])

  const cubagemUnitaria = useMemo(() => {
    if (!produtoSelecionado) return 0

    const largura = Number(produtoSelecionado.largura || 0)
    const comprimento = Number(produtoSelecionado.comprimento || 0)
    const altura = Number(produtoSelecionado.altura || 0)

    return (largura / 1000) * (comprimento / 1000) * (altura / 1000)
  }, [produtoSelecionado])

  const cubagemTotal = useMemo(() => {
    return cubagemUnitaria * Number(quantidade || 0)
  }, [cubagemUnitaria, quantidade])

  const pesoTotal = useMemo(() => {
    return Number(produtoSelecionado?.peso || 0) * Number(quantidade || 0)
  }, [produtoSelecionado, quantidade])

  const produtosUnicosLista = useMemo(() => {
    return Array.from(new Set(lancamentos.map((item) => item.produto_id.toString())))
  }, [lancamentos])

  const transportadorasUnicasLista = useMemo(() => {
    return Array.from(
      new Set(lancamentos.map((item) => item.transportadora_id.toString()))
    )
  }, [lancamentos])

  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((lancamento) => {
      const nomeProduto = buscarNomeProduto(lancamento.produto_id).toLowerCase()
      const nomeTransportadora = buscarNomeTransportadora(
        lancamento.transportadora_id
      ).toLowerCase()
      const nomeCidade = buscarNomeCidade(lancamento.cidade_id).toLowerCase()
      const texto = buscaLista.toLowerCase()

      const passouBusca =
        !buscaLista ||
        nomeProduto.includes(texto) ||
        nomeTransportadora.includes(texto) ||
        nomeCidade.includes(texto)

      const passouProduto = filtroProdutoLista
        ? String(lancamento.produto_id) === filtroProdutoLista
        : true

      const passouTransportadora = filtroTransportadoraLista
        ? String(lancamento.transportadora_id) === filtroTransportadoraLista
        : true

      const dataLancamento = lancamento.data.slice(0, 10)

      const passouDataInicial = dataInicialLista
        ? dataLancamento >= dataInicialLista
        : true

      const passouDataFinal = dataFinalLista
        ? dataLancamento <= dataFinalLista
        : true

      return (
        passouBusca &&
        passouProduto &&
        passouTransportadora &&
        passouDataInicial &&
        passouDataFinal
      )
    })
  }, [
    lancamentos,
    buscaLista,
    filtroProdutoLista,
    filtroTransportadoraLista,
    dataInicialLista,
    dataFinalLista,
    produtos,
    transportadoras,
    cidades
  ])

  function limparFiltrosLista() {
    setBuscaLista('')
    setFiltroProdutoLista('')
    setFiltroTransportadoraLista('')
    setDataInicialLista('')
    setDataFinalLista('')
  }

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
    marginBottom: '20px'
  }

  const inputStyle = {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    minWidth: '0',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' as const
  }

  const filtroStyle = {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    minWidth: '0',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' as const
  }

  const buttonStyle = {
    padding: '12px 18px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    background: '#111827',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    width: '100%'
  }

  const cancelButtonStyle = {
    padding: '12px 18px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    background: '#6b7280',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    width: '100%'
  }

  const editButtonStyle = {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: '#2563eb',
    color: '#fff',
    fontSize: '13px',
    marginRight: '6px'
  }

  const deleteButtonStyle = {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: '#dc2626',
    color: '#fff',
    fontSize: '13px'
  }

  const dropdownStyle = {
    position: 'absolute' as const,
    background: '#fff',
    border: '1px solid #d1d5db',
    width: '100%',
    maxHeight: '180px',
    overflowY: 'auto' as const,
    zIndex: 10,
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
    borderRadius: '10px'
  }

  const itemStyle = {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px'
  }

  const th = {
    padding: '14px 12px',
    textAlign: 'left' as const,
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
    fontSize: '14px',
    fontWeight: 700
  }

  const td = {
    padding: '14px 12px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px'
  }

  return (
    <div
      style={{
        padding: '24px',
        background: '#f3f4f6',
        minHeight: '100vh'
      }}
    >
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '28px',
            marginBottom: '20px',
            color: '#111827'
          }}
        >
          Lançamentos de Frete
        </h1>

        <div style={cardStyle}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}
          >
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar produto..."
                value={nomeProdutoSelecionado()}
                onChange={(e) => {
                  setProdutoId('')
                  setBuscaProduto(e.target.value)
                }}
                style={inputStyle}
              />

              {buscaProduto && !produtoId && (
                <div style={dropdownStyle}>
                  {produtos
                    .filter((p) =>
                      p.nome.toLowerCase().includes(buscaProduto.toLowerCase())
                    )
                    .map((produto) => (
                      <div
                        key={produto.id}
                        onClick={() => {
                          setProdutoId(String(produto.id))
                          setBuscaProduto('')
                        }}
                        style={itemStyle}
                      >
                        {produto.nome}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar transportadora..."
                value={nomeTransportadoraSelecionada()}
                onChange={(e) => {
                  setTransportadoraId('')
                  setBuscaTransportadora(e.target.value)
                }}
                style={inputStyle}
              />

              {buscaTransportadora && !transportadoraId && (
                <div style={dropdownStyle}>
                  {transportadoras
                    .filter((t) =>
                      t.nome.toLowerCase().includes(buscaTransportadora.toLowerCase())
                    )
                    .map((transportadora) => (
                      <div
                        key={transportadora.id}
                        onClick={() => {
                          setTransportadoraId(String(transportadora.id))
                          setBuscaTransportadora('')
                        }}
                        style={itemStyle}
                      >
                        {transportadora.nome}
                      </div>
                    ))}
                </div>
              )}
            </div>

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

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar cidade..."
                value={nomeCidadeSelecionada()}
                onChange={(e) => {
                  setCidadeId('')
                  setBuscaCidade(e.target.value)
                }}
                style={inputStyle}
                disabled={!estadoId}
              />

              {buscaCidade && !cidadeId && estadoId && (
                <div style={dropdownStyle}>
                  {cidadesFiltradas
                    .filter((c) =>
                      c.nome.toLowerCase().includes(buscaCidade.toLowerCase())
                    )
                    .map((cidade) => (
                      <div
                        key={cidade.id}
                        onClick={() => {
                          setCidadeId(String(cidade.id))
                          setBuscaCidade('')
                        }}
                        style={itemStyle}
                      >
                        {cidade.nome}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <input
              type="number"
              placeholder="Quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Valor do frete"
              value={valorFrete}
              onChange={(e) => setValorFrete(e.target.value)}
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Prazo de entrega (dias)"
              value={prazoEntrega}
              onChange={(e) => setPrazoEntrega(e.target.value)}
              style={inputStyle}
            />
          </div>

          {produtoSelecionado && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '18px'
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '14px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  Largura
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  {formatarNumero(Number(produtoSelecionado.largura || 0), 0)} mm
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '14px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  Comprimento
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  {formatarNumero(Number(produtoSelecionado.comprimento || 0), 0)} mm
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '14px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                  Altura
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  {formatarNumero(Number(produtoSelecionado.altura || 0), 0)} mm
                </div>
              </div>

              <div
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '12px',
                  padding: '14px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#c2410c', marginBottom: '6px' }}>
                  Peso unitário
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#9a3412' }}>
                  {formatarNumero(Number(produtoSelecionado.peso || 0), 2)} kg
                </div>
              </div>

              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '14px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#1d4ed8', marginBottom: '6px' }}>
                  Cubagem unitária
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e3a8a' }}>
                  {formatarNumero(cubagemUnitaria, 4)} m³
                </div>
              </div>

              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '14px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '6px' }}>
                  Cubagem total
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>
                  {quantidade ? `${formatarNumero(cubagemTotal, 4)} m³` : '-'}
                </div>
              </div>

              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '14px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#b91c1c', marginBottom: '6px' }}>
                  Peso total
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#7f1d1d' }}>
                  {quantidade ? `${formatarNumero(pesoTotal, 2)} kg` : '-'}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px'
            }}
          >
            <button onClick={salvarOuAtualizarLancamento} style={buttonStyle}>
              {editandoId ? 'Atualizar Lançamento' : 'Salvar Lançamento'}
            </button>

            {editandoId && (
              <button onClick={limparFormulario} style={cancelButtonStyle}>
                Cancelar Edição
              </button>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '16px'
            }}
          >
            <input
              type="text"
              placeholder="Buscar na lista..."
              value={buscaLista}
              onChange={(e) => setBuscaLista(e.target.value)}
              style={filtroStyle}
            />

            <select
              value={filtroProdutoLista}
              onChange={(e) => setFiltroProdutoLista(e.target.value)}
              style={filtroStyle}
            >
              <option value="">Todos os produtos</option>
              {produtosUnicosLista.map((id) => (
                <option key={id} value={id}>
                  {buscarNomeProduto(Number(id))}
                </option>
              ))}
            </select>

            <select
              value={filtroTransportadoraLista}
              onChange={(e) => setFiltroTransportadoraLista(e.target.value)}
              style={filtroStyle}
            >
              <option value="">Todas as transportadoras</option>
              {transportadorasUnicasLista.map((id) => (
                <option key={id} value={id}>
                  {buscarNomeTransportadora(Number(id))}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dataInicialLista}
              onChange={(e) => setDataInicialLista(e.target.value)}
              style={filtroStyle}
            />

            <input
              type="date"
              value={dataFinalLista}
              onChange={(e) => setDataFinalLista(e.target.value)}
              style={filtroStyle}
            />

            <button onClick={limparFiltrosLista} style={cancelButtonStyle}>
              Limpar filtros
            </button>
          </div>

          <div
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1200px' }}>
              <thead>
                <tr>
                  <th style={th}>Data</th>
                  <th style={th}>Produto</th>
                  <th style={th}>Transportadora</th>
                  <th style={th}>Cidade</th>
                  <th style={th}>Quantidade</th>
                  <th style={th}>Cubagem Total</th>
                  <th style={th}>Peso Total</th>
                  <th style={th}>Valor do Frete</th>
                  <th style={th}>Prazo de Entrega</th>
                  <th style={th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lancamentosFiltrados.map((lancamento) => {
                  const produto = buscarProduto(lancamento.produto_id)

                  const cubagemItem =
                    ((Number(produto?.largura || 0) / 1000) *
                      (Number(produto?.comprimento || 0) / 1000) *
                      (Number(produto?.altura || 0) / 1000)) *
                    Number(lancamento.quantidade || 0)

                  const pesoItem =
                    Number(produto?.peso || 0) * Number(lancamento.quantidade || 0)

                  return (
                    <tr key={lancamento.id}>
                      <td style={td}>
                        {new Date(lancamento.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={td}>{buscarNomeProduto(lancamento.produto_id)}</td>
                      <td style={td}>
                        {buscarNomeTransportadora(lancamento.transportadora_id)}
                      </td>
                      <td style={td}>{buscarNomeCidade(lancamento.cidade_id)}</td>
                      <td style={td}>{lancamento.quantidade}</td>
                      <td style={td}>{formatarNumero(cubagemItem, 4)} m³</td>
                      <td style={td}>{formatarNumero(pesoItem, 2)} kg</td>
                      <td style={td}>{formatarMoeda(lancamento.valor_frete)}</td>
                      <td style={td}>
                        {lancamento.prazo_entrega != null
                          ? `${lancamento.prazo_entrega} dia(s)`
                          : '-'}
                      </td>
                      <td style={td}>
                        <button
                          onClick={() => editarLancamento(lancamento)}
                          style={editButtonStyle}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => excluirLancamento(lancamento.id)}
                          style={deleteButtonStyle}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {lancamentosFiltrados.length === 0 && (
                  <tr>
                    <td style={td} colSpan={10}>
                      Nenhum lançamento encontrado.
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
