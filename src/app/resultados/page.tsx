'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

type Resultado = {
  produto: string
  transportadora: string
  estado: string
  uf: string
  qtd_lancamentos: number
  quantidade_media: number
  cubagem_unitaria: number
  cubagem_total_media: number
  peso_unitario: number
  peso_total_medio: number
  frete_medio: number
}

type Produto = {
  id: number
  nome: string
}

type Transportadora = {
  id: number
  nome: string
}

type Cidade = {
  id: number
  nome: string
  estado_id: number
}

type Estado = {
  id: number
  nome: string
  uf: string
}

type LancamentoFrete = {
  id: number
  data: string
  produto_id: number
  transportadora_id: number
  cidade_id: number
  quantidade: number
  valor_frete: number
  prazo_entrega: number | null
}

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [lancamentosRaw, setLancamentosRaw] = useState<LancamentoFrete[]>([])
  const [produtosRef, setProdutosRef] = useState<Produto[]>([])
  const [transportadorasRef, setTransportadorasRef] = useState<Transportadora[]>([])
  const [cidadesRef, setCidadesRef] = useState<Cidade[]>([])
  const [estadosRef, setEstadosRef] = useState<Estado[]>([])

  const [busca, setBusca] = useState('')
  const [filtroProduto, setFiltroProduto] = useState('')
  const [filtroTransportadora, setFiltroTransportadora] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroAno, setFiltroAno] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    buscarResultados()
  }, [filtroMes, filtroAno, dataInicial, dataFinal])

  async function buscarResultados() {
    try {
      setLoading(true)

      const [
        resultadosResponse,
        lancamentosResponse,
        produtosResponse,
        transportadorasResponse,
        cidadesResponse,
        estadosResponse
      ] = await Promise.all([
        supabase.rpc('resultado_frete_por_produto_estado', {
          filtro_mes: filtroMes ? Number(filtroMes) : null,
          filtro_ano: filtroAno ? Number(filtroAno) : null,
          filtro_data_inicial: dataInicial || null,
          filtro_data_final: dataFinal || null
        }),
        supabase
          .from('lancamentos_frete')
          .select('id, data, produto_id, transportadora_id, cidade_id, quantidade, valor_frete, prazo_entrega')
          .order('id', { ascending: false }),
        supabase.from('produtos').select('id, nome'),
        supabase.from('transportadoras').select('id, nome'),
        supabase.from('cidades').select('id, nome, estado_id'),
        supabase.from('estados').select('id, nome, uf')
      ])

      if (resultadosResponse.error) {
        console.error('Erro ao buscar resultados:', resultadosResponse.error)
        return
      }

      if (lancamentosResponse.error) {
        console.error('Erro ao buscar lançamentos para prazo:', lancamentosResponse.error)
      }

      if (produtosResponse.error) {
        console.error('Erro ao buscar produtos de referência:', produtosResponse.error)
      }

      if (transportadorasResponse.error) {
        console.error('Erro ao buscar transportadoras de referência:', transportadorasResponse.error)
      }

      if (cidadesResponse.error) {
        console.error('Erro ao buscar cidades de referência:', cidadesResponse.error)
      }

      if (estadosResponse.error) {
        console.error('Erro ao buscar estados de referência:', estadosResponse.error)
      }

      setResultados(resultadosResponse.data || [])
      setLancamentosRaw(lancamentosResponse.data || [])
      setProdutosRef(produtosResponse.data || [])
      setTransportadorasRef(transportadorasResponse.data || [])
      setCidadesRef(cidadesResponse.data || [])
      setEstadosRef(estadosResponse.data || [])
    } finally {
      setLoading(false)
    }
  }

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString('pt-BR', {
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

  function formatarDataIso(data: string) {
    return data.slice(0, 10)
  }

  function getProdutoNomeById(id: number) {
    return produtosRef.find((item) => item.id === id)?.nome || ''
  }

  function getTransportadoraNomeById(id: number) {
    return transportadorasRef.find((item) => item.id === id)?.nome || ''
  }

  function getEstadoByCidadeId(cidadeId: number) {
    const cidade = cidadesRef.find((item) => item.id === cidadeId)
    if (!cidade) return null
    return estadosRef.find((item) => item.id === cidade.estado_id) || null
  }

  function exportarExcel() {
    if (!resultadosFiltrados.length) {
      alert('Nenhum dado para exportar.')
      return
    }

    const dados = resultadosFiltrados.map((item) => ({
      Produto: item.produto,
      Transportadora: item.transportadora,
      Estado: item.estado,
      UF: item.uf,
      'Qtd. Lançamentos': Number(item.qtd_lancamentos),
      'Quantidade Média': Number(item.quantidade_media),
      'Cubagem Unitária (m³)': Number(item.cubagem_unitaria),
      'Cubagem Total Média (m³)': Number(item.cubagem_total_media),
      'Peso Unitário (kg)': Number(item.peso_unitario),
      'Peso Total Médio (kg)': Number(item.peso_total_medio),
      'Frete Médio (R$)': Number(item.frete_medio),
      'Prazo Médio (dias)': Number(buscarPrazoMedioResultado(item).toFixed(2))
    }))

    const worksheet = XLSX.utils.json_to_sheet(dados)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    })

    saveAs(
      blob,
      `resultados_frete_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  const produtosUnicos = useMemo(() => {
    return Array.from(new Set(resultados.map((item) => item.produto))).sort((a, b) =>
      a.localeCompare(b)
    )
  }, [resultados])

  const transportadorasUnicas = useMemo(() => {
    return Array.from(new Set(resultados.map((item) => item.transportadora))).sort((a, b) =>
      a.localeCompare(b)
    )
  }, [resultados])

  const estadosUnicos = useMemo(() => {
    return Array.from(new Set(resultados.map((item) => item.estado))).sort((a, b) =>
      a.localeCompare(b)
    )
  }, [resultados])

  const anosDisponiveis = useMemo(() => {
    const anoAtual = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => String(anoAtual - i))
  }, [])

  const resultadosFiltrados = useMemo(() => {
    return resultados.filter((item) => {
      const texto = busca.toLowerCase()

      const passouBusca =
        item.produto.toLowerCase().includes(texto) ||
        item.transportadora.toLowerCase().includes(texto) ||
        item.estado.toLowerCase().includes(texto) ||
        item.uf.toLowerCase().includes(texto)

      const passouProduto = filtroProduto ? item.produto === filtroProduto : true
      const passouTransportadora = filtroTransportadora
        ? item.transportadora === filtroTransportadora
        : true
      const passouEstado = filtroEstado ? item.estado === filtroEstado : true

      return passouBusca && passouProduto && passouTransportadora && passouEstado
    })
  }, [resultados, busca, filtroProduto, filtroTransportadora, filtroEstado])

  const lancamentosFiltradosPrazo = useMemo(() => {
    return lancamentosRaw.filter((item) => {
      const produtoNome = getProdutoNomeById(item.produto_id)
      const transportadoraNome = getTransportadoraNomeById(item.transportadora_id)
      const estadoData = getEstadoByCidadeId(item.cidade_id)
      const estadoNome = estadoData?.nome || ''
      const uf = estadoData?.uf || ''
      const dataLancamento = formatarDataIso(item.data)

      const texto = busca.toLowerCase()
      const passouBusca =
        !busca ||
        produtoNome.toLowerCase().includes(texto) ||
        transportadoraNome.toLowerCase().includes(texto) ||
        estadoNome.toLowerCase().includes(texto) ||
        uf.toLowerCase().includes(texto)

      const passouProduto = filtroProduto ? produtoNome === filtroProduto : true
      const passouTransportadora = filtroTransportadora
        ? transportadoraNome === filtroTransportadora
        : true
      const passouEstado = filtroEstado ? estadoNome === filtroEstado : true

      const passouDataInicial = dataInicial ? dataLancamento >= dataInicial : true
      const passouDataFinal = dataFinal ? dataLancamento <= dataFinal : true

      const dataObj = new Date(item.data)
      const mesLancamento = String(dataObj.getMonth() + 1)
      const anoLancamento = String(dataObj.getFullYear())

      const passouMes = filtroMes ? mesLancamento === filtroMes : true
      const passouAno = filtroAno ? anoLancamento === filtroAno : true

      return (
        passouBusca &&
        passouProduto &&
        passouTransportadora &&
        passouEstado &&
        passouDataInicial &&
        passouDataFinal &&
        passouMes &&
        passouAno
      )
    })
  }, [
    lancamentosRaw,
    busca,
    filtroProduto,
    filtroTransportadora,
    filtroEstado,
    filtroMes,
    filtroAno,
    dataInicial,
    dataFinal,
    produtosRef,
    transportadorasRef,
    cidadesRef,
    estadosRef
  ])

  function buscarPrazoMedioResultado(item: Resultado) {
    const itensRelacionados = lancamentosFiltradosPrazo.filter((lancamento) => {
      const produtoNome = getProdutoNomeById(lancamento.produto_id)
      const transportadoraNome = getTransportadoraNomeById(lancamento.transportadora_id)
      const estadoData = getEstadoByCidadeId(lancamento.cidade_id)
      const estadoNome = estadoData?.nome || ''
      const uf = estadoData?.uf || ''

      return (
        produtoNome === item.produto &&
        transportadoraNome === item.transportadora &&
        (estadoNome === item.estado || uf === item.uf)
      )
    })

    const validos = itensRelacionados.filter((itemLancamento) => itemLancamento.prazo_entrega != null)

    if (!validos.length) return 0

    const total = validos.reduce(
      (acc, itemLancamento) => acc + Number(itemLancamento.prazo_entrega || 0),
      0
    )

    return total / validos.length
  }

  const resultadosComPrazo = useMemo(() => {
    return resultadosFiltrados.map((item) => ({
      ...item,
      prazo_medio: buscarPrazoMedioResultado(item)
    }))
  }, [resultadosFiltrados, lancamentosFiltradosPrazo])

  const totalLancamentos = useMemo(() => {
    return resultadosFiltrados.reduce(
      (total, item) => total + Number(item.qtd_lancamentos || 0),
      0
    )
  }, [resultadosFiltrados])

  const freteMedioGeral = useMemo(() => {
    if (!resultadosFiltrados.length) return 0
    return (
      resultadosFiltrados.reduce(
        (total, item) => total + Number(item.frete_medio || 0),
        0
      ) / resultadosFiltrados.length
    )
  }, [resultadosFiltrados])

  const cubagemMediaGeral = useMemo(() => {
    if (!resultadosFiltrados.length) return 0
    return (
      resultadosFiltrados.reduce(
        (total, item) => total + Number(item.cubagem_total_media || 0),
        0
      ) / resultadosFiltrados.length
    )
  }, [resultadosFiltrados])

  const pesoMedioGeral = useMemo(() => {
    if (!resultadosFiltrados.length) return 0
    return (
      resultadosFiltrados.reduce(
        (total, item) => total + Number(item.peso_total_medio || 0),
        0
      ) / resultadosFiltrados.length
    )
  }, [resultadosFiltrados])

  const prazoMedioGeral = useMemo(() => {
    const itensComPrazo = lancamentosFiltradosPrazo.filter((item) => item.prazo_entrega != null)

    if (!itensComPrazo.length) return 0

    const total = itensComPrazo.reduce(
      (acc, item) => acc + Number(item.prazo_entrega || 0),
      0
    )

    return total / itensComPrazo.length
  }, [lancamentosFiltradosPrazo])

  const custoMedioPorKg = useMemo(() => {
    if (!resultadosFiltrados.length) return 0

    const freteTotal = resultadosFiltrados.reduce(
      (total, item) => total + Number(item.frete_medio || 0),
      0
    )
    const pesoTotal = resultadosFiltrados.reduce(
      (total, item) => total + Number(item.peso_total_medio || 0),
      0
    )

    return pesoTotal > 0 ? freteTotal / pesoTotal : 0
  }, [resultadosFiltrados])

  const custoMedioPorM3 = useMemo(() => {
    if (!resultadosFiltrados.length) return 0

    const freteTotal = resultadosFiltrados.reduce(
      (total, item) => total + Number(item.frete_medio || 0),
      0
    )
    const cubagemTotal = resultadosFiltrados.reduce(
      (total, item) => total + Number(item.cubagem_total_media || 0),
      0
    )

    return cubagemTotal > 0 ? freteTotal / cubagemTotal : 0
  }, [resultadosFiltrados])

  const rankingTransportadoras = useMemo(() => {
    const mapa = new Map<
      string,
      {
        transportadora: string
        freteTotal: number
        pesoTotal: number
        cubagemTotal: number
        prazoTotal: number
        registros: number
        registrosPrazo: number
      }
    >()

    resultadosComPrazo.forEach((item) => {
      const chave = item.transportadora || 'Não informada'
      const atual = mapa.get(chave)

      if (atual) {
        atual.freteTotal += Number(item.frete_medio || 0)
        atual.pesoTotal += Number(item.peso_total_medio || 0)
        atual.cubagemTotal += Number(item.cubagem_total_media || 0)
        atual.prazoTotal += Number(item.prazo_medio || 0)
        atual.registros += 1
        if (item.prazo_medio > 0) atual.registrosPrazo += 1
      } else {
        mapa.set(chave, {
          transportadora: chave,
          freteTotal: Number(item.frete_medio || 0),
          pesoTotal: Number(item.peso_total_medio || 0),
          cubagemTotal: Number(item.cubagem_total_media || 0),
          prazoTotal: Number(item.prazo_medio || 0),
          registros: 1,
          registrosPrazo: item.prazo_medio > 0 ? 1 : 0
        })
      }
    })

    return Array.from(mapa.values())
      .map((item) => {
        const freteMedio = item.registros > 0 ? item.freteTotal / item.registros : 0
        const custoKg = item.pesoTotal > 0 ? item.freteTotal / item.pesoTotal : 0
        const custoM3 = item.cubagemTotal > 0 ? item.freteTotal / item.cubagemTotal : 0
        const prazoMedio = item.registrosPrazo > 0 ? item.prazoTotal / item.registrosPrazo : 0
        const score =
          custoKg * 0.35 +
          custoM3 * 0.20 +
          freteMedio * 0.25 +
          prazoMedio * 0.20

        return {
          transportadora: item.transportadora,
          freteMedio: Number(freteMedio.toFixed(2)),
          custoKg: Number(custoKg.toFixed(4)),
          custoM3: Number(custoM3.toFixed(4)),
          prazoMedio: Number(prazoMedio.toFixed(2)),
          score: Number(score.toFixed(2)),
          registros: item.registros
        }
      })
      .sort((a, b) => a.score - b.score)
  }, [resultadosComPrazo])

  const melhorTransportadora = rankingTransportadoras[0] || null
  const piorTransportadora =
    rankingTransportadoras[rankingTransportadoras.length - 1] || null

  const estadoMaisCaro = useMemo(() => {
    if (!resultadosFiltrados.length) return null

    const mapa = new Map<string, { estado: string; frete: number; count: number }>()

    resultadosFiltrados.forEach((item) => {
      const chave = item.estado || 'Não informado'
      const atual = mapa.get(chave)

      if (atual) {
        atual.frete += Number(item.frete_medio || 0)
        atual.count += 1
      } else {
        mapa.set(chave, {
          estado: chave,
          frete: Number(item.frete_medio || 0),
          count: 1
        })
      }
    })

    return Array.from(mapa.values())
      .map((item) => ({
        estado: item.estado,
        freteMedio: item.count > 0 ? item.frete / item.count : 0
      }))
      .sort((a, b) => b.freteMedio - a.freteMedio)[0]
  }, [resultadosFiltrados])

  const graficoFreteTransportadora = useMemo(() => {
    return rankingTransportadoras
      .slice(0, 8)
      .map((item) => ({
        transportadora: item.transportadora,
        freteMedio: item.freteMedio,
        custoKg: item.custoKg,
        prazoMedio: item.prazoMedio
      }))
  }, [rankingTransportadoras])

  const graficoProdutos = useMemo(() => {
    const mapa = new Map<string, number>()

    resultadosFiltrados.forEach((item) => {
      mapa.set(
        item.produto,
        (mapa.get(item.produto) || 0) + Number(item.qtd_lancamentos || 0)
      )
    })

    return Array.from(mapa.entries())
      .map(([produto, total]) => ({
        produto,
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [resultadosFiltrados])

  const graficoPrazoTransportadora = useMemo(() => {
    return rankingTransportadoras
      .slice(0, 8)
      .map((item) => ({
        transportadora: item.transportadora,
        prazoMedio: item.prazoMedio
      }))
  }, [rankingTransportadoras])

  const alertas = useMemo(() => {
    const lista: string[] = []

    if (!resultadosFiltrados.length) {
      lista.push('Nenhum dado encontrado com os filtros selecionados.')
      return lista
    }

    if (custoMedioPorKg > 0 && custoMedioPorKg > 8) {
      lista.push('O custo médio por kg está elevado nesta visão filtrada.')
    }

    if (custoMedioPorM3 > 0 && custoMedioPorM3 > 1200) {
      lista.push('O custo médio por m³ está alto nesta visão filtrada.')
    }

    if (prazoMedioGeral > 0 && prazoMedioGeral > 7) {
      lista.push('O prazo médio de entrega está elevado nesta visão filtrada.')
    }

    if (melhorTransportadora && piorTransportadora) {
      const dif =
        melhorTransportadora.score > 0
          ? piorTransportadora.score / melhorTransportadora.score
          : 0

      if (dif > 1.35) {
        lista.push(
          'Existe uma diferença relevante entre a melhor e a pior transportadora nesta análise.'
        )
      }
    }

    return lista
  }, [
    resultadosFiltrados,
    custoMedioPorKg,
    custoMedioPorM3,
    prazoMedioGeral,
    melhorTransportadora,
    piorTransportadora
  ])

  const pieColors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
    marginBottom: '20px'
  }

  const kpiCardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
    minWidth: '220px',
    flex: 1
  }

  const th: React.CSSProperties = {
    padding: '14px 12px',
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
    fontSize: '14px',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  }

  const td: React.CSSProperties = {
    padding: '14px 12px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px',
    whiteSpace: 'nowrap'
  }

  const filtroStyle: React.CSSProperties = {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    fontSize: '14px',
    minWidth: '220px'
  }

  function limparFiltros() {
    setBusca('')
    setFiltroProduto('')
    setFiltroTransportadora('')
    setFiltroEstado('')
    setFiltroMes('')
    setFiltroAno('')
    setDataInicial('')
    setDataFinal('')
  }

  return (
    <div
      style={{
        padding: '24px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
        minHeight: '100vh'
      }}
    >
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '30px',
            marginBottom: '20px',
            color: '#111827',
            fontWeight: 800
          }}
        >
          Resultados de Frete
        </h1>

        {!!alertas.length && (
          <div
            style={{
              display: 'grid',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            {alertas.map((alerta, index) => (
              <div
                key={index}
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fdba74',
                  color: '#9a3412',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                ⚠️ {alerta}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
            <div style={kpiTitleStyle}>Frete médio geral</div>
            <div style={kpiValueStyle}>{formatarMoeda(freteMedioGeral)}</div>
          </div>

          <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
            <div style={kpiTitleStyle}>Total de lançamentos</div>
            <div style={kpiValueStyle}>{formatarNumero(totalLancamentos, 0)}</div>
          </div>

          <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
            <div style={kpiTitleStyle}>Cubagem total média</div>
            <div style={kpiValueStyle}>{formatarNumero(cubagemMediaGeral, 4)} m³</div>
          </div>

          <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <div style={kpiTitleStyle}>Peso total médio</div>
            <div style={kpiValueStyle}>{formatarNumero(pesoMedioGeral, 2)} kg</div>
          </div>

          <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
            <div style={kpiTitleStyle}>Custo médio por kg</div>
            <div style={kpiValueStyle}>{formatarMoeda(custoMedioPorKg)}</div>
          </div>

          <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
            <div style={kpiTitleStyle}>Custo médio por m³</div>
            <div style={kpiValueStyle}>{formatarMoeda(custoMedioPorM3)}</div>
          </div>

          <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)' }}>
            <div style={kpiTitleStyle}>Prazo médio de entrega</div>
            <div style={kpiValueStyle}>{formatarNumero(prazoMedioGeral, 1)} dias</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type='text'
              placeholder='Busca geral por produto, transportadora, estado ou UF...'
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ ...filtroStyle, minWidth: '360px' }}
            />

            <select
              value={filtroProduto}
              onChange={(e) => setFiltroProduto(e.target.value)}
              style={filtroStyle}
            >
              <option value=''>Todos os produtos</option>
              {produtosUnicos.map((produto) => (
                <option key={produto} value={produto}>
                  {produto}
                </option>
              ))}
            </select>

            <select
              value={filtroTransportadora}
              onChange={(e) => setFiltroTransportadora(e.target.value)}
              style={filtroStyle}
            >
              <option value=''>Todas as transportadoras</option>
              {transportadorasUnicas.map((transportadora) => (
                <option key={transportadora} value={transportadora}>
                  {transportadora}
                </option>
              ))}
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={filtroStyle}
            >
              <option value=''>Todos os estados</option>
              {estadosUnicos.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>

            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              style={filtroStyle}
            >
              <option value=''>Todos os meses</option>
              <option value='1'>Janeiro</option>
              <option value='2'>Fevereiro</option>
              <option value='3'>Março</option>
              <option value='4'>Abril</option>
              <option value='5'>Maio</option>
              <option value='6'>Junho</option>
              <option value='7'>Julho</option>
              <option value='8'>Agosto</option>
              <option value='9'>Setembro</option>
              <option value='10'>Outubro</option>
              <option value='11'>Novembro</option>
              <option value='12'>Dezembro</option>
            </select>

            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              style={filtroStyle}
            >
              <option value=''>Todos os anos</option>
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>

            <input
              type='date'
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              style={filtroStyle}
            />

            <input
              type='date'
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              style={filtroStyle}
            />

            <button
              onClick={limparFiltros}
              style={{
                padding: '12px 16px',
                border: 'none',
                borderRadius: '10px',
                background: '#6b7280',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Limpar filtros
            </button>

            <button
              onClick={exportarExcel}
              style={{
                padding: '12px 16px',
                border: 'none',
                borderRadius: '10px',
                background: '#16a34a',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Exportar Excel
            </button>
          </div>

          <div
            style={{
              marginTop: '14px',
              fontSize: '13px',
              color: '#64748b'
            }}
          >
            {loading
              ? 'Carregando resultados...'
              : `${resultadosFiltrados.length} registros exibidos.`}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div style={cardStyle}>
            <div style={chartTitleStyle}>Frete médio por transportadora</div>
            <div style={chartSubtitleStyle}>
              Comparativo entre as principais transportadoras da visão filtrada.
            </div>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={graficoFreteTransportadora}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} />
                  <XAxis
                    dataKey='transportadora'
                    interval={0}
                    angle={-12}
                    textAnchor='end'
                    height={70}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Frete Médio' || name === 'Custo/Kg') {
                        return formatarMoeda(Number(value || 0))
                      }
                      return `${formatarNumero(Number(value || 0), 1)} dias`
                    }}
                  />
                  <Legend />
                  <Bar dataKey='freteMedio' name='Frete Médio' fill='#2563eb' radius={[8, 8, 0, 0]} />
                  <Bar dataKey='custoKg' name='Custo/Kg' fill='#16a34a' radius={[8, 8, 0, 0]} />
                  <Bar dataKey='prazoMedio' name='Prazo Médio' fill='#0891b2' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={chartTitleStyle}>Participação por produto</div>
            <div style={chartSubtitleStyle}>
              Produtos com maior volume de lançamentos.
            </div>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={graficoProdutos}
                    dataKey='total'
                    nameKey='produto'
                    outerRadius={110}
                    innerRadius={55}
                    paddingAngle={3}
                    labelLine={false}
                    label={({ percent }) =>
                      `${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {graficoProdutos.map((_, index) => (
                      <Cell
                        key={index}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatarNumero(Number(value || 0), 0)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 1fr)',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div style={cardStyle}>
            <div style={chartTitleStyle}>Prazo médio por transportadora</div>
            <div style={chartSubtitleStyle}>
              Comparativo dos prazos médios dentro da visão filtrada.
            </div>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={graficoPrazoTransportadora}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} />
                  <XAxis
                    dataKey='transportadora'
                    interval={0}
                    angle={-12}
                    textAnchor='end'
                    height={70}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => `${formatarNumero(Number(value || 0), 1)} dias`} />
                  <Bar dataKey='prazoMedio' name='Prazo Médio' fill='#7c3aed' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '16px'
            }}
          >
            <div style={cardStyle}>
              <div style={kpiTitleStyle}>Melhor transportadora</div>
              <div style={{ ...kpiValueStyle, fontSize: '22px' }}>
                {melhorTransportadora?.transportadora || '-'}
              </div>
              <div style={kpiHintStyle}>
                Score: {formatarNumero(melhorTransportadora?.score || 0, 2)} | Prazo: {formatarNumero(melhorTransportadora?.prazoMedio || 0, 1)} dias
              </div>
            </div>

            <div style={cardStyle}>
              <div style={kpiTitleStyle}>Pior transportadora</div>
              <div style={{ ...kpiValueStyle, fontSize: '22px' }}>
                {piorTransportadora?.transportadora || '-'}
              </div>
              <div style={kpiHintStyle}>
                Score: {formatarNumero(piorTransportadora?.score || 0, 2)} | Prazo: {formatarNumero(piorTransportadora?.prazoMedio || 0, 1)} dias
              </div>
            </div>

            <div style={cardStyle}>
              <div style={kpiTitleStyle}>Estado mais caro</div>
              <div style={{ ...kpiValueStyle, fontSize: '22px' }}>
                {estadoMaisCaro?.estado || '-'}
              </div>
              <div style={kpiHintStyle}>
                Frete médio: {formatarMoeda(estadoMaisCaro?.freteMedio || 0)}
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1500px' }}>
              <thead>
                <tr>
                  <th style={th}>Produto</th>
                  <th style={th}>Transportadora</th>
                  <th style={th}>Estado</th>
                  <th style={th}>UF</th>
                  <th style={th}>Qtd. Lançamentos</th>
                  <th style={th}>Quantidade Média</th>
                  <th style={th}>Cubagem Unitária</th>
                  <th style={th}>Cubagem Total Média</th>
                  <th style={th}>Peso Unitário</th>
                  <th style={th}>Peso Total Médio</th>
                  <th style={th}>Frete Médio</th>
                  <th style={th}>Prazo Médio</th>
                </tr>
              </thead>
              <tbody>
                {resultadosComPrazo.map((item, index) => (
                  <tr key={index}>
                    <td style={td}>{item.produto}</td>
                    <td style={td}>{item.transportadora}</td>
                    <td style={td}>{item.estado}</td>
                    <td style={td}>{item.uf}</td>
                    <td style={td}>{item.qtd_lancamentos}</td>
                    <td style={td}>{formatarNumero(item.quantidade_media, 2)}</td>
                    <td style={td}>{formatarNumero(item.cubagem_unitaria, 4)} m³</td>
                    <td style={td}>{formatarNumero(item.cubagem_total_media, 4)} m³</td>
                    <td style={td}>{formatarNumero(item.peso_unitario, 2)} kg</td>
                    <td style={td}>{formatarNumero(item.peso_total_medio, 2)} kg</td>
                    <td style={td}>{formatarMoeda(item.frete_medio)}</td>
                    <td style={td}>
                      {item.prazo_medio > 0
                        ? `${formatarNumero(item.prazo_medio, 1)} dias`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const kpiTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  marginBottom: '8px',
  fontWeight: 600
}

const kpiValueStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: '#111827'
}

const kpiHintStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  marginTop: '8px'
}

const chartTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  marginBottom: '6px',
  color: '#111827'
}

const chartSubtitleStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  marginBottom: '18px'
}
