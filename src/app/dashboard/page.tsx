'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
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

type Filtros = {
  dataInicial: string
  dataFinal: string
  mes: string
  ano: string
  transportadora: string
  estado: string
  produto: string
}

type RankingTransportadora = {
  transportadora: string
  freteMedio: number
  custoKg: number
  custoM3: number
  prazoMedio: number
  score: number
  scoreFormatado: number
  registros: number
  pesoTotal: number
  cubagemTotal: number
}

const filtrosIniciais: Filtros = {
  dataInicial: '',
  dataFinal: '',
  mes: '',
  ano: '',
  transportadora: '',
  estado: '',
  produto: ''
}

export default function DashboardPage() {
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [lancamentosRaw, setLancamentosRaw] = useState<LancamentoFrete[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciais)

  useEffect(() => {
    buscarResultados()
  }, [filtros.dataInicial, filtros.dataFinal, filtros.mes, filtros.ano])

  async function buscarResultados() {
    try {
      setLoading(true)
      setErro('')

      const [
        rpcResponse,
        lancamentosResponse,
        produtosResponse,
        transportadorasResponse,
        cidadesResponse,
        estadosResponse
      ] = await Promise.all([
        supabase.rpc('resultado_frete_por_produto_estado', {
          filtro_mes: filtros.mes ? Number(filtros.mes) : null,
          filtro_ano: filtros.ano ? Number(filtros.ano) : null,
          filtro_data_inicial: filtros.dataInicial || null,
          filtro_data_final: filtros.dataFinal || null
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

      if (rpcResponse.error) {
        console.error('Erro ao buscar dashboard:', rpcResponse.error)
        setErro('Não foi possível carregar os dados consolidados do dashboard.')
        return
      }

      if (lancamentosResponse.error) {
        console.error('Erro ao buscar lançamentos do dashboard:', lancamentosResponse.error)
        setErro('Não foi possível carregar os lançamentos do dashboard.')
        return
      }

      if (produtosResponse.error) {
        console.error('Erro ao buscar produtos do dashboard:', produtosResponse.error)
      }

      if (transportadorasResponse.error) {
        console.error('Erro ao buscar transportadoras do dashboard:', transportadorasResponse.error)
      }

      if (cidadesResponse.error) {
        console.error('Erro ao buscar cidades do dashboard:', cidadesResponse.error)
      }

      if (estadosResponse.error) {
        console.error('Erro ao buscar estados do dashboard:', estadosResponse.error)
      }

      setResultados(rpcResponse.data || [])
      setLancamentosRaw(lancamentosResponse.data || [])
      setProdutos(produtosResponse.data || [])
      setTransportadoras(transportadorasResponse.data || [])
      setCidades(cidadesResponse.data || [])
      setEstados(estadosResponse.data || [])
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error)
      setErro('Ocorreu um erro inesperado ao carregar o dashboard.')
    } finally {
      setLoading(false)
    }
  }

  function atualizarFiltro<K extends keyof Filtros>(campo: K, valor: Filtros[K]) {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor
    }))
  }

  function limparFiltros() {
    setFiltros(filtrosIniciais)
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
    return produtos.find((item) => item.id === id)?.nome || ''
  }

  function getTransportadoraNomeById(id: number) {
    return transportadoras.find((item) => item.id === id)?.nome || ''
  }

  function getUfByCidadeId(cidadeId: number) {
    const cidade = cidades.find((item) => item.id === cidadeId)
    if (!cidade) return ''
    return estados.find((item) => item.id === cidade.estado_id)?.uf || ''
  }

  function getEstadoNomeByCidadeId(cidadeId: number) {
    const cidade = cidades.find((item) => item.id === cidadeId)
    if (!cidade) return ''
    return estados.find((item) => item.id === cidade.estado_id)?.nome || ''
  }

  const opcoesTransportadora = useMemo(() => {
    return Array.from(
      new Set(
        resultados
          .map((item) => item.transportadora?.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'))
  }, [resultados])

  const opcoesEstado = useMemo(() => {
    return Array.from(
      new Set(
        resultados
          .map((item) => item.uf?.trim() || item.estado?.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'))
  }, [resultados])

  const opcoesProduto = useMemo(() => {
    return Array.from(
      new Set(
        resultados
          .map((item) => item.produto?.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'))
  }, [resultados])

  const resultadosFiltrados = useMemo(() => {
    return resultados.filter((item) => {
      const matchTransportadora =
        !filtros.transportadora || item.transportadora === filtros.transportadora

      const ufOuEstado = item.uf || item.estado || ''
      const matchEstado =
        !filtros.estado || ufOuEstado === filtros.estado

      const matchProduto =
        !filtros.produto || item.produto === filtros.produto

      return matchTransportadora && matchEstado && matchProduto
    })
  }, [resultados, filtros.transportadora, filtros.estado, filtros.produto])

  const lancamentosFiltradosPrazo = useMemo(() => {
    return lancamentosRaw.filter((item) => {
      const nomeProduto = getProdutoNomeById(item.produto_id)
      const nomeTransportadora = getTransportadoraNomeById(item.transportadora_id)
      const uf = getUfByCidadeId(item.cidade_id)
      const estadoNome = getEstadoNomeByCidadeId(item.cidade_id)
      const dataLancamento = formatarDataIso(item.data)

      const matchProduto =
        !filtros.produto || nomeProduto === filtros.produto

      const matchTransportadora =
        !filtros.transportadora || nomeTransportadora === filtros.transportadora

      const ufOuEstado = uf || estadoNome || ''
      const matchEstado =
        !filtros.estado || ufOuEstado === filtros.estado

      const matchDataInicial =
        !filtros.dataInicial || dataLancamento >= filtros.dataInicial

      const matchDataFinal =
        !filtros.dataFinal || dataLancamento <= filtros.dataFinal

      const dataObj = new Date(item.data)
      const mesLancamento = String(dataObj.getMonth() + 1)
      const anoLancamento = String(dataObj.getFullYear())

      const matchMes = !filtros.mes || mesLancamento === filtros.mes
      const matchAno = !filtros.ano || anoLancamento === filtros.ano

      return (
        matchProduto &&
        matchTransportadora &&
        matchEstado &&
        matchDataInicial &&
        matchDataFinal &&
        matchMes &&
        matchAno
      )
    })
  }, [lancamentosRaw, filtros, produtos, transportadoras, cidades, estados])

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

  const pesoMedioGeral = useMemo(() => {
    if (!resultadosFiltrados.length) return 0
    return (
      resultadosFiltrados.reduce(
        (total, item) => total + Number(item.peso_total_medio || 0),
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

  const custoMedioKg = useMemo(() => {
    const freteTotal = resultadosFiltrados.reduce(
      (acc, item) => acc + Number(item.frete_medio || 0),
      0
    )
    const pesoTotal = resultadosFiltrados.reduce(
      (acc, item) => acc + Number(item.peso_total_medio || 0),
      0
    )
    return pesoTotal > 0 ? freteTotal / pesoTotal : 0
  }, [resultadosFiltrados])

  const custoMedioM3 = useMemo(() => {
    const freteTotal = resultadosFiltrados.reduce(
      (acc, item) => acc + Number(item.frete_medio || 0),
      0
    )
    const cubagemTotal = resultadosFiltrados.reduce(
      (acc, item) => acc + Number(item.cubagem_total_media || 0),
      0
    )
    return cubagemTotal > 0 ? freteTotal / cubagemTotal : 0
  }, [resultadosFiltrados])

  const prazoMedioGeral = useMemo(() => {
    const itensComPrazo = lancamentosFiltradosPrazo.filter(
      (item) => item.prazo_entrega != null
    )

    if (!itensComPrazo.length) return 0

    const total = itensComPrazo.reduce(
      (acc, item) => acc + Number(item.prazo_entrega || 0),
      0
    )

    return total / itensComPrazo.length
  }, [lancamentosFiltradosPrazo])

  const rankingTransportadoras = useMemo<RankingTransportadora[]>(() => {
    const mapaResultado = new Map<
      string,
      {
        transportadora: string
        freteTotal: number
        pesoTotal: number
        cubagemTotal: number
        registros: number
      }
    >()

    resultadosFiltrados.forEach((item) => {
      const chave = item.transportadora || 'Não informada'

      if (!mapaResultado.has(chave)) {
        mapaResultado.set(chave, {
          transportadora: chave,
          freteTotal: 0,
          pesoTotal: 0,
          cubagemTotal: 0,
          registros: 0
        })
      }

      const atual = mapaResultado.get(chave)!
      atual.freteTotal += Number(item.frete_medio || 0)
      atual.pesoTotal += Number(item.peso_total_medio || 0)
      atual.cubagemTotal += Number(item.cubagem_total_media || 0)
      atual.registros += 1
    })

    const mapaPrazo = new Map<
      string,
      {
        somaPrazo: number
        registrosPrazo: number
      }
    >()

    lancamentosFiltradosPrazo.forEach((item) => {
      const nomeTransportadora = getTransportadoraNomeById(item.transportadora_id) || 'Não informada'

      if (!mapaPrazo.has(nomeTransportadora)) {
        mapaPrazo.set(nomeTransportadora, {
          somaPrazo: 0,
          registrosPrazo: 0
        })
      }

      if (item.prazo_entrega != null) {
        const atual = mapaPrazo.get(nomeTransportadora)!
        atual.somaPrazo += Number(item.prazo_entrega || 0)
        atual.registrosPrazo += 1
      }
    })

    return Array.from(mapaResultado.values())
      .map((item) => {
        const freteMedio = item.registros > 0 ? item.freteTotal / item.registros : 0
        const custoKg = item.pesoTotal > 0 ? item.freteTotal / item.pesoTotal : 0
        const custoM3 = item.cubagemTotal > 0 ? item.freteTotal / item.cubagemTotal : 0

        const prazoData = mapaPrazo.get(item.transportadora)
        const prazoMedio =
          prazoData && prazoData.registrosPrazo > 0
            ? prazoData.somaPrazo / prazoData.registrosPrazo
            : 0

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
          score,
          scoreFormatado: Number(score.toFixed(2)),
          registros: item.registros,
          pesoTotal: Number(item.pesoTotal.toFixed(2)),
          cubagemTotal: Number(item.cubagemTotal.toFixed(4))
        }
      })
      .sort((a, b) => a.score - b.score)
  }, [resultadosFiltrados, lancamentosFiltradosPrazo, produtos, transportadoras, cidades, estados])

  const melhorTransportadora = rankingTransportadoras[0] || null
  const piorTransportadora = rankingTransportadoras[rankingTransportadoras.length - 1] || null

  const fretePorEstado = useMemo(() => {
    const mapa = new Map<string, { uf: string; frete: number; registros: number }>()

    resultadosFiltrados.forEach((item) => {
      const chave = item.uf || 'N/I'
      const atual = mapa.get(chave)

      if (atual) {
        atual.frete += Number(item.frete_medio || 0)
        atual.registros += 1
      } else {
        mapa.set(chave, {
          uf: chave,
          frete: Number(item.frete_medio || 0),
          registros: 1
        })
      }
    })

    return Array.from(mapa.values())
      .map((item) => ({
        uf: item.uf,
        frete: item.registros > 0 ? Number((item.frete / item.registros).toFixed(2)) : 0
      }))
      .sort((a, b) => b.frete - a.frete)
      .slice(0, 10)
  }, [resultadosFiltrados])

  const prazoPorTransportadora = useMemo(() => {
    const mapa = new Map<string, { transportadora: string; prazo: number; registros: number }>()

    lancamentosFiltradosPrazo.forEach((item) => {
      if (item.prazo_entrega == null) return

      const nomeTransportadora = getTransportadoraNomeById(item.transportadora_id) || 'Não informada'

      if (!mapa.has(nomeTransportadora)) {
        mapa.set(nomeTransportadora, {
          transportadora: nomeTransportadora,
          prazo: 0,
          registros: 0
        })
      }

      const atual = mapa.get(nomeTransportadora)!
      atual.prazo += Number(item.prazo_entrega || 0)
      atual.registros += 1
    })

    return Array.from(mapa.values())
      .map((item) => ({
        transportadora: item.transportadora,
        prazoMedio: item.registros > 0 ? Number((item.prazo / item.registros).toFixed(2)) : 0
      }))
      .sort((a, b) => a.prazoMedio - b.prazoMedio)
      .slice(0, 8)
  }, [lancamentosFiltradosPrazo, transportadoras])

  const topProdutos = useMemo(() => {
    const mapa = new Map<string, number>()

    resultadosFiltrados.forEach((item) => {
      const atual = mapa.get(item.produto || 'Não informado') || 0
      mapa.set(item.produto || 'Não informado', atual + Number(item.qtd_lancamentos || 0))
    })

    return Array.from(mapa.entries())
      .map(([produto, total]) => ({ produto, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [resultadosFiltrados])

  const graficoCombinado = useMemo(() => {
    return rankingTransportadoras.slice(0, 8).map((item) => ({
      transportadora: item.transportadora,
      freteMedio: item.freteMedio,
      custoKg: Number(item.custoKg.toFixed(2)),
      custoM3: Number(item.custoM3.toFixed(2)),
      prazoMedio: Number(item.prazoMedio.toFixed(2))
    }))
  }, [rankingTransportadoras])

  const graficoTendencia = useMemo(() => {
    return rankingTransportadoras.slice(0, 8).map((item, index) => ({
      posicao: index + 1,
      transportadora: item.transportadora,
      score: item.scoreFormatado
    }))
  }, [rankingTransportadoras])

  const alertas = useMemo(() => {
    const lista: string[] = []

    if (!resultadosFiltrados.length) {
      lista.push('Nenhum dado encontrado com os filtros selecionados.')
      return lista
    }

    if (custoMedioKg > 8) {
      lista.push('O custo médio por kg está elevado e merece revisão.')
    }

    if (custoMedioM3 > 1200) {
      lista.push('O custo médio por m³ está alto para a base atual.')
    }

    if (prazoMedioGeral > 7) {
      lista.push('O prazo médio de entrega está elevado para a visão atual.')
    }

    if (melhorTransportadora && piorTransportadora) {
      const diferenca = melhorTransportadora.score > 0
        ? piorTransportadora.score / melhorTransportadora.score
        : 0

      if (diferenca > 1.35) {
        lista.push('Existe diferença relevante entre a melhor e a pior transportadora.')
      }
    }

    return lista
  }, [resultadosFiltrados, custoMedioKg, custoMedioM3, prazoMedioGeral, melhorTransportadora, piorTransportadora])

  const pieColors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']

  const pageStyle: React.CSSProperties = {
    padding: '24px',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #f8fafc 100%)',
    minHeight: '100vh'
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '1650px',
    margin: '0 auto'
  }

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '24px',
    padding: '22px',
    boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    marginBottom: '8px',
    color: '#0f172a',
    fontWeight: 900
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px',
    lineHeight: 1.6
  }

  const kpiTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '10px',
    fontWeight: 700
  }

  const kpiValueStyle: React.CSSProperties = {
    fontSize: '30px',
    fontWeight: 900,
    color: '#0f172a'
  }

  const kpiHintStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '8px'
  }

  const chartTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 800,
    marginBottom: '8px',
    color: '#0f172a'
  }

  const chartSubtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '18px'
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '14px 12px',
    background: '#f8fafc',
    borderBottom: '1px solid #e5e7eb',
    color: '#334155',
    fontSize: '13px',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  }

  const tdStyle: React.CSSProperties = {
    padding: '14px 12px',
    borderBottom: '1px solid #f1f5f9',
    color: '#0f172a',
    fontSize: '14px',
    whiteSpace: 'nowrap'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '6px'
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '42px',
    borderRadius: '12px',
    border: '1px solid #dbe2ea',
    padding: '0 12px',
    fontSize: '14px',
    color: '#0f172a',
    background: '#fff',
    outline: 'none'
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: '42px',
    borderRadius: '12px',
    border: 'none',
    background: '#0f172a',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={titleStyle}>Dashboard Executivo de Fretes</h1>
          <div style={subtitleStyle}>
            Painel comparativo com indicadores estratégicos, ranking de transportadoras,
            leitura visual de desempenho e visão executiva da operação logística.
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={chartTitleStyle}>Filtros do dashboard</div>
          <div style={chartSubtitleStyle}>
            Os filtros de período consultam a base no Supabase. Os filtros de transportadora,
            estado e produto refinam o resultado na tela.
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              alignItems: 'end'
            }}
          >
            <div>
              <label style={labelStyle}>Data inicial</label>
              <input
                type='date'
                value={filtros.dataInicial}
                onChange={(e) => atualizarFiltro('dataInicial', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Data final</label>
              <input
                type='date'
                value={filtros.dataFinal}
                onChange={(e) => atualizarFiltro('dataFinal', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Mês</label>
              <select
                value={filtros.mes}
                onChange={(e) => atualizarFiltro('mes', e.target.value)}
                style={inputStyle}
              >
                <option value=''>Todos</option>
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
            </div>

            <div>
              <label style={labelStyle}>Ano</label>
              <input
                type='number'
                placeholder='Ex.: 2026'
                value={filtros.ano}
                onChange={(e) => atualizarFiltro('ano', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Transportadora</label>
              <select
                value={filtros.transportadora}
                onChange={(e) => atualizarFiltro('transportadora', e.target.value)}
                style={inputStyle}
              >
                <option value=''>Todas</option>
                {opcoesTransportadora.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => atualizarFiltro('estado', e.target.value)}
                style={inputStyle}
              >
                <option value=''>Todos</option>
                {opcoesEstado.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Produto</label>
              <select
                value={filtros.produto}
                onChange={(e) => atualizarFiltro('produto', e.target.value)}
                style={inputStyle}
              >
                <option value=''>Todos</option>
                {opcoesProduto.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button onClick={limparFiltros} style={buttonStyle} type='button'>
                Limpar filtros
              </button>
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
            {loading
              ? 'Carregando dados...'
              : `${resultadosFiltrados.length} registros exibidos no dashboard.`}
          </div>

          {!!erro && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              {erro}
            </div>
          )}
        </div>

        {!!alertas.length && (
          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {alertas.map((alerta, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)',
                  border: '1px solid #fdba74',
                  color: '#9a3412',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  fontSize: '14px',
                  fontWeight: 700
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
            marginBottom: '24px'
          }}
        >
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
            <div style={kpiTitleStyle}>Frete médio geral</div>
            <div style={kpiValueStyle}>{formatarMoeda(freteMedioGeral)}</div>
            <div style={kpiHintStyle}>Média consolidada da base</div>
          </div>

          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
            <div style={kpiTitleStyle}>Total de lançamentos</div>
            <div style={kpiValueStyle}>{formatarNumero(totalLancamentos, 0)}</div>
            <div style={kpiHintStyle}>Total consolidado</div>
          </div>

          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)' }}>
            <div style={kpiTitleStyle}>Custo médio por kg</div>
            <div style={kpiValueStyle}>{formatarMoeda(custoMedioKg)}</div>
            <div style={kpiHintStyle}>Relação frete x peso</div>
          </div>

          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' }}>
            <div style={kpiTitleStyle}>Custo médio por m³</div>
            <div style={kpiValueStyle}>{formatarMoeda(custoMedioM3)}</div>
            <div style={kpiHintStyle}>Relação frete x cubagem</div>
          </div>

          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)' }}>
            <div style={kpiTitleStyle}>Prazo médio de entrega</div>
            <div style={kpiValueStyle}>{formatarNumero(prazoMedioGeral, 1)} dias</div>
            <div style={kpiHintStyle}>Média dos lançamentos filtrados</div>
          </div>

          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <div style={kpiTitleStyle}>Peso total médio</div>
            <div style={kpiValueStyle}>{formatarNumero(pesoMedioGeral, 2)} kg</div>
            <div style={kpiHintStyle}>Média por registro</div>
          </div>

          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
            <div style={kpiTitleStyle}>Cubagem total média</div>
            <div style={kpiValueStyle}>{formatarNumero(cubagemMediaGeral, 4)} m³</div>
            <div style={kpiHintStyle}>Média por registro</div>
          </div>

          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)' }}>
            <div style={kpiTitleStyle}>Melhor transportadora</div>
            <div style={{ ...kpiValueStyle, fontSize: '24px' }}>{melhorTransportadora?.transportadora || '-'}</div>
            <div style={kpiHintStyle}>
              Score: {formatarNumero(melhorTransportadora?.scoreFormatado || 0, 2)} | Prazo: {formatarNumero(melhorTransportadora?.prazoMedio || 0, 1)} dias
            </div>
          </div>

          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' }}>
            <div style={kpiTitleStyle}>Pior transportadora</div>
            <div style={{ ...kpiValueStyle, fontSize: '24px' }}>{piorTransportadora?.transportadora || '-'}</div>
            <div style={kpiHintStyle}>
              Score: {formatarNumero(piorTransportadora?.scoreFormatado || 0, 2)} | Prazo: {formatarNumero(piorTransportadora?.prazoMedio || 0, 1)} dias
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <div style={cardStyle}>
            <div style={chartTitleStyle}>Comparativo de transportadoras</div>
            <div style={chartSubtitleStyle}>
              Visão comparativa de frete médio, custo por kg, custo por m³ e prazo médio.
            </div>
            <div style={{ width: '100%', height: 380 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={graficoCombinado}>
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
                      if (name === 'Frete Médio') return formatarMoeda(Number(value || 0))
                      if (name === 'Custo/Kg') return formatarMoeda(Number(value || 0))
                      if (name === 'Custo/m³') return formatarMoeda(Number(value || 0))
                      if (name === 'Prazo Médio') return `${formatarNumero(Number(value || 0), 1)} dias`
                      return formatarNumero(Number(value || 0), 2)
                    }}
                  />
                  <Legend />
                  <Bar dataKey='freteMedio' name='Frete Médio' fill='#2563eb' radius={[8, 8, 0, 0]} />
                  <Bar dataKey='custoKg' name='Custo/Kg' fill='#16a34a' radius={[8, 8, 0, 0]} />
                  <Bar dataKey='custoM3' name='Custo/m³' fill='#f97316' radius={[8, 8, 0, 0]} />
                  <Bar dataKey='prazoMedio' name='Prazo Médio' fill='#0891b2' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={chartTitleStyle}>Participação por produto</div>
            <div style={chartSubtitleStyle}>
              Distribuição dos produtos com maior volume de lançamentos.
            </div>
            <div style={{ width: '100%', height: 380 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={topProdutos}
                    dataKey='total'
                    nameKey='produto'
                    outerRadius={120}
                    innerRadius={58}
                    paddingAngle={3}
                    labelLine={false}
                    label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {topProdutos.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
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
            gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(0, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <div style={cardStyle}>
            <div style={chartTitleStyle}>Ranking de transportadoras</div>
            <div style={chartSubtitleStyle}>
              Menor score representa melhor eficiência consolidada. O score agora considera custo e prazo.
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '860px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Transportadora</th>
                    <th style={thStyle}>Frete médio</th>
                    <th style={thStyle}>Custo/kg</th>
                    <th style={thStyle}>Custo/m³</th>
                    <th style={thStyle}>Prazo médio</th>
                    <th style={thStyle}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingTransportadoras.map((item, index) => {
                    const isBest = index === 0
                    const isWorst = index === rankingTransportadoras.length - 1

                    return (
                      <tr
                        key={item.transportadora}
                        style={{
                          background: isBest
                            ? '#f0fdf4'
                            : isWorst
                            ? '#fef2f2'
                            : '#ffffff'
                        }}
                      >
                        <td style={tdStyle}>{index + 1}</td>
                        <td style={tdStyle}><strong>{item.transportadora}</strong></td>
                        <td style={tdStyle}>{formatarMoeda(item.freteMedio)}</td>
                        <td style={tdStyle}>{formatarMoeda(item.custoKg)}</td>
                        <td style={tdStyle}>{formatarMoeda(item.custoM3)}</td>
                        <td style={tdStyle}>{formatarNumero(item.prazoMedio, 1)} dias</td>
                        <td style={tdStyle}>{formatarNumero(item.scoreFormatado, 2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={chartTitleStyle}>Tendência de score por posição</div>
            <div style={chartSubtitleStyle}>
              Leitura rápida da diferença de desempenho entre as melhores transportadoras.
            </div>
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={graficoTendencia}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} />
                  <XAxis dataKey='posicao' />
                  <YAxis />
                  <Tooltip formatter={(value) => formatarNumero(Number(value || 0), 2)} />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='score'
                    name='Score'
                    stroke='#2563eb'
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <div style={cardStyle}>
            <div style={chartTitleStyle}>Frete médio por estado</div>
            <div style={chartSubtitleStyle}>
              Estados com maior custo médio de frete na operação.
            </div>
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={fretePorEstado}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} />
                  <XAxis dataKey='uf' />
                  <YAxis />
                  <Tooltip formatter={(value) => formatarMoeda(Number(value || 0))} />
                  <Bar dataKey='frete' fill='#7c3aed' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={chartTitleStyle}>Prazo médio por transportadora</div>
            <div style={chartSubtitleStyle}>
              Comparativo do prazo médio de entrega entre as principais transportadoras.
            </div>
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={prazoPorTransportadora}>
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
                  <Bar dataKey='prazoMedio' fill='#0891b2' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
