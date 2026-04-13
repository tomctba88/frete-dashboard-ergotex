'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
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

type RankingTransportadora = {
  nome: string
  freteMedio: number
  custoKg: number
  custoM3: number
  score: number
  pesoTotal: number
  cubagemTotal: number
  totalRegistros: number
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
  const [resultadosPeriodoAnterior, setResultadosPeriodoAnterior] = useState<Resultado[]>([])
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

      const { data, error } = await supabase.rpc(
        'resultado_frete_por_produto_estado',
        {
          filtro_mes: filtros.mes ? Number(filtros.mes) : null,
          filtro_ano: filtros.ano ? Number(filtros.ano) : null,
          filtro_data_inicial: filtros.dataInicial || null,
          filtro_data_final: filtros.dataFinal || null
        }
      )

      if (error) {
        console.error('Erro ao buscar dashboard:', error)
        setErro('Não foi possível carregar os dados do dashboard.')
        return
      }

      setResultados(data || [])
      await buscarPeriodoAnterior()
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error)
      setErro('Ocorreu um erro inesperado ao carregar o dashboard.')
    } finally {
      setLoading(false)
    }
  }

  async function buscarPeriodoAnterior() {
    if (!filtros.dataInicial || !filtros.dataFinal) {
      setResultadosPeriodoAnterior([])
      return
    }

    try {
      const dataInicialAtual = new Date(filtros.dataInicial + 'T00:00:00')
      const dataFinalAtual = new Date(filtros.dataFinal + 'T00:00:00')

      if (Number.isNaN(dataInicialAtual.getTime()) || Number.isNaN(dataFinalAtual.getTime())) {
        setResultadosPeriodoAnterior([])
        return
      }

      const diffMs = dataFinalAtual.getTime() - dataInicialAtual.getTime()
      const umDia = 24 * 60 * 60 * 1000

      const dataFinalAnterior = new Date(dataInicialAtual.getTime() - umDia)
      const dataInicialAnterior = new Date(dataFinalAnterior.getTime() - diffMs)

      const { data, error } = await supabase.rpc(
        'resultado_frete_por_produto_estado',
        {
          filtro_mes: null,
          filtro_ano: null,
          filtro_data_inicial: formatarDataISO(dataInicialAnterior),
          filtro_data_final: formatarDataISO(dataFinalAnterior)
        }
      )

      if (error) {
        console.error('Erro ao buscar período anterior:', error)
        setResultadosPeriodoAnterior([])
        return
      }

      setResultadosPeriodoAnterior(data || [])
    } catch (error) {
      console.error('Erro ao buscar período anterior:', error)
      setResultadosPeriodoAnterior([])
    }
  }

  function formatarDataISO(data: Date) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
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

  function calcularVariacao(atual: number, anterior: number) {
    if (!anterior) return 0
    return ((atual - anterior) / anterior) * 100
  }

  function calcularMedia(arr: Resultado[], campo: keyof Resultado) {
    if (!arr.length) return 0

    return (
      arr.reduce((total, item) => total + Number(item[campo] || 0), 0) / arr.length
    )
  }

  function calcularCustoKg(arr: Resultado[]) {
    const freteTotal = arr.reduce(
      (acc, item) => acc + Number(item.frete_medio || 0),
      0
    )

    const pesoTotal = arr.reduce(
      (acc, item) => acc + Number(item.peso_total_medio || 0),
      0
    )

    return pesoTotal > 0 ? freteTotal / pesoTotal : 0
  }

  function calcularCustoM3(arr: Resultado[]) {
    const freteTotal = arr.reduce(
      (acc, item) => acc + Number(item.frete_medio || 0),
      0
    )

    const cubagemTotal = arr.reduce(
      (acc, item) => acc + Number(item.cubagem_total_media || 0),
      0
    )

    return cubagemTotal > 0 ? freteTotal / cubagemTotal : 0
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

  const resultadosPeriodoAnteriorFiltrados = useMemo(() => {
    return resultadosPeriodoAnterior.filter((item) => {
      const matchTransportadora =
        !filtros.transportadora || item.transportadora === filtros.transportadora

      const ufOuEstado = item.uf || item.estado || ''
      const matchEstado =
        !filtros.estado || ufOuEstado === filtros.estado

      const matchProduto =
        !filtros.produto || item.produto === filtros.produto

      return matchTransportadora && matchEstado && matchProduto
    })
  }, [resultadosPeriodoAnterior, filtros.transportadora, filtros.estado, filtros.produto])

  const totalLancamentos = useMemo(() => {
    return resultadosFiltrados.reduce(
      (total, item) => total + Number(item.qtd_lancamentos || 0),
      0
    )
  }, [resultadosFiltrados])

  const totalLancamentosAnterior = useMemo(() => {
    return resultadosPeriodoAnteriorFiltrados.reduce(
      (total, item) => total + Number(item.qtd_lancamentos || 0),
      0
    )
  }, [resultadosPeriodoAnteriorFiltrados])

  const freteMedioGeral = useMemo(() => {
    return calcularMedia(resultadosFiltrados, 'frete_medio')
  }, [resultadosFiltrados])

  const freteMedioGeralAnterior = useMemo(() => {
    return calcularMedia(resultadosPeriodoAnteriorFiltrados, 'frete_medio')
  }, [resultadosPeriodoAnteriorFiltrados])

  const cubagemMediaGeral = useMemo(() => {
    return calcularMedia(resultadosFiltrados, 'cubagem_total_media')
  }, [resultadosFiltrados])

  const cubagemMediaGeralAnterior = useMemo(() => {
    return calcularMedia(resultadosPeriodoAnteriorFiltrados, 'cubagem_total_media')
  }, [resultadosPeriodoAnteriorFiltrados])

  const quantidadeMediaGeral = useMemo(() => {
    return calcularMedia(resultadosFiltrados, 'quantidade_media')
  }, [resultadosFiltrados])

  const quantidadeMediaGeralAnterior = useMemo(() => {
    return calcularMedia(resultadosPeriodoAnteriorFiltrados, 'quantidade_media')
  }, [resultadosPeriodoAnteriorFiltrados])

  const pesoMedioGeral = useMemo(() => {
    return calcularMedia(resultadosFiltrados, 'peso_total_medio')
  }, [resultadosFiltrados])

  const pesoMedioGeralAnterior = useMemo(() => {
    return calcularMedia(resultadosPeriodoAnteriorFiltrados, 'peso_total_medio')
  }, [resultadosPeriodoAnteriorFiltrados])

  const custoMedioKgGeral = useMemo(() => {
    return calcularCustoKg(resultadosFiltrados)
  }, [resultadosFiltrados])

  const custoMedioKgGeralAnterior = useMemo(() => {
    return calcularCustoKg(resultadosPeriodoAnteriorFiltrados)
  }, [resultadosPeriodoAnteriorFiltrados])

  const custoMedioM3Geral = useMemo(() => {
    return calcularCustoM3(resultadosFiltrados)
  }, [resultadosFiltrados])

  const custoMedioM3GeralAnterior = useMemo(() => {
    return calcularCustoM3(resultadosPeriodoAnteriorFiltrados)
  }, [resultadosPeriodoAnteriorFiltrados])

  const fretePorEstado = useMemo(() => {
    const mapa = new Map<string, { estado: string; frete: number; count: number }>()

    resultadosFiltrados.forEach((item) => {
      const chave = item.uf || item.estado || 'N/I'
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
        frete: Number((item.frete / item.count).toFixed(2))
      }))
      .sort((a, b) => b.frete - a.frete)
      .slice(0, 8)
  }, [resultadosFiltrados])

  const topProdutos = useMemo(() => {
    const mapa = new Map<string, number>()

    resultadosFiltrados.forEach((item) => {
      const produto = item.produto || 'Não informado'
      const atual = mapa.get(produto) || 0
      mapa.set(produto, atual + Number(item.qtd_lancamentos || 0))
    })

    return Array.from(mapa.entries())
      .map(([produto, total]) => ({
        produto,
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [resultadosFiltrados])

  const rankingTransportadoras = useMemo<RankingTransportadora[]>(() => {
    const mapa = new Map<
      string,
      {
        nome: string
        frete: number
        peso: number
        cubagem: number
        count: number
      }
    >()

    resultadosFiltrados.forEach((item) => {
      const chave = item.transportadora || 'Não informada'

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          nome: chave,
          frete: 0,
          peso: 0,
          cubagem: 0,
          count: 0
        })
      }

      const atual = mapa.get(chave)!

      atual.frete += Number(item.frete_medio || 0)
      atual.peso += Number(item.peso_total_medio || 0)
      atual.cubagem += Number(item.cubagem_total_media || 0)
      atual.count += 1
    })

    return Array.from(mapa.values())
      .map((item) => {
        const freteMedio = item.count > 0 ? item.frete / item.count : 0
        const custoKg = item.peso > 0 ? item.frete / item.peso : 0
        const custoM3 = item.cubagem > 0 ? item.frete / item.cubagem : 0
        const score = custoKg * 0.5 + custoM3 * 0.3 + freteMedio * 0.2

        return {
          nome: item.nome,
          freteMedio: Number(freteMedio.toFixed(2)),
          custoKg: Number(custoKg.toFixed(4)),
          custoM3: Number(custoM3.toFixed(4)),
          score: Number(score.toFixed(4)),
          pesoTotal: Number(item.peso.toFixed(2)),
          cubagemTotal: Number(item.cubagem.toFixed(4)),
          totalRegistros: item.count
        }
      })
      .sort((a, b) => a.score - b.score)
  }, [resultadosFiltrados])

  const melhorTransportadora = rankingTransportadoras[0] || null
  const piorTransportadora =
    rankingTransportadoras[rankingTransportadoras.length - 1] || null

  const alertas = useMemo(() => {
    const lista: string[] = []

    if (melhorTransportadora && piorTransportadora) {
      const diferencaScore =
        melhorTransportadora.score > 0
          ? piorTransportadora.score / melhorTransportadora.score
          : 0

      if (diferencaScore > 1.4) {
        lista.push(
          `Diferença relevante entre a melhor e a pior transportadora: ${(
            diferencaScore * 100 - 100
          ).toFixed(0)}%`
        )
      }
    }

    if (custoMedioKgGeral > 0 && custoMedioKgGeral > 8) {
      lista.push('O custo médio por kg está elevado e merece revisão.')
    }

    if (custoMedioM3Geral > 0 && custoMedioM3Geral > 1200) {
      lista.push('O custo médio por m³ está alto para a base atual.')
    }

    if (!resultadosFiltrados.length) {
      lista.push('Nenhum registro encontrado para os filtros selecionados.')
    }

    return lista
  }, [
    melhorTransportadora,
    piorTransportadora,
    custoMedioKgGeral,
    custoMedioM3Geral,
    resultadosFiltrados.length
  ])

  const dadosComparativoTransportadoras = useMemo(() => {
    return rankingTransportadoras.slice(0, 8)
  }, [rankingTransportadoras])

  const pesoPorTransportadora = useMemo(() => {
    return rankingTransportadoras
      .map((item) => ({
        nome: item.nome,
        peso: item.totalRegistros > 0 ? item.pesoTotal / item.totalRegistros : 0
      }))
      .sort((a, b) => b.peso - a.peso)
      .slice(0, 8)
      .map((item) => ({
        ...item,
        peso: Number(item.peso.toFixed(2))
      }))
  }, [rankingTransportadoras])

  const variacoes = useMemo(() => {
    return {
      freteMedio: calcularVariacao(freteMedioGeral, freteMedioGeralAnterior),
      totalLancamentos: calcularVariacao(totalLancamentos, totalLancamentosAnterior),
      custoKg: calcularVariacao(custoMedioKgGeral, custoMedioKgGeralAnterior),
      custoM3: calcularVariacao(custoMedioM3Geral, custoMedioM3GeralAnterior),
      peso: calcularVariacao(pesoMedioGeral, pesoMedioGeralAnterior),
      cubagem: calcularVariacao(cubagemMediaGeral, cubagemMediaGeralAnterior),
      quantidade: calcularVariacao(quantidadeMediaGeral, quantidadeMediaGeralAnterior)
    }
  }, [
    freteMedioGeral,
    freteMedioGeralAnterior,
    totalLancamentos,
    totalLancamentosAnterior,
    custoMedioKgGeral,
    custoMedioKgGeralAnterior,
    custoMedioM3Geral,
    custoMedioM3GeralAnterior,
    pesoMedioGeral,
    pesoMedioGeralAnterior,
    cubagemMediaGeral,
    cubagemMediaGeralAnterior,
    quantidadeMediaGeral,
    quantidadeMediaGeralAnterior
  ])

  const pieColors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']
  const barColors = ['#2563eb', '#16a34a', '#f97316', '#7c3aed']

  const pageStyle: React.CSSProperties = {
    padding: '24px',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #f8fafc 100%)',
    minHeight: '100vh'
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '1600px',
    margin: '0 auto'
  }

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '24px',
    padding: '22px',
    boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)'
  }

  const chartTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '8px',
    color: '#0f172a'
  }

  const chartSubtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '18px'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '30px',
    marginBottom: '8px',
    color: '#0f172a',
    fontWeight: 800
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px',
    lineHeight: 1.5
  }

  const kpiTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '10px',
    fontWeight: 600
  }

  const kpiValueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 800,
    color: '#0f172a'
  }

  const kpiHintStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '8px'
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={titleStyle}>Dashboard de Frete</h1>
          <div style={subtitleStyle}>
            Visão geral dos lançamentos, desempenho logístico, ranking de
            transportadoras e comparação de custo por peso e cubagem.
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={chartTitleStyle}>Filtros do dashboard</div>
          <div style={chartSubtitleStyle}>
            Os filtros de período consultam a base no Supabase. Os filtros de
            transportadora, estado e produto refinam o resultado na tela.
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
                type="date"
                value={filtros.dataInicial}
                onChange={(e) => atualizarFiltro('dataInicial', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Data final</label>
              <input
                type="date"
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
                <option value="">Todos</option>
                <option value="1">Janeiro</option>
                <option value="2">Fevereiro</option>
                <option value="3">Março</option>
                <option value="4">Abril</option>
                <option value="5">Maio</option>
                <option value="6">Junho</option>
                <option value="7">Julho</option>
                <option value="8">Agosto</option>
                <option value="9">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Ano</label>
              <input
                type="number"
                placeholder="Ex.: 2026"
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
                <option value="">Todas</option>
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
                <option value="">Todos</option>
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
                <option value="">Todos</option>
                {opcoesProduto.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={limparFiltros}
                style={buttonStyle}
                type="button"
              >
                Limpar filtros
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              fontSize: '13px',
              color: '#64748b'
            }}
          >
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
          <div
            style={{
              display: 'grid',
              gap: '12px',
              marginBottom: '24px'
            }}
          >
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
            marginBottom: '24px'
          }}
        >
          <KpiCard
            title="Frete médio geral"
            value={formatarMoeda(freteMedioGeral)}
            hint="Média da base filtrada"
            variation={variacoes.freteMedio}
            previousValue={formatarMoeda(freteMedioGeralAnterior)}
            isLowerBetter
            background="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
          />

          <KpiCard
            title="Total de lançamentos"
            value={formatarNumero(totalLancamentos, 0)}
            hint="Total consolidado filtrado"
            variation={variacoes.totalLancamentos}
            previousValue={formatarNumero(totalLancamentosAnterior, 0)}
            background="linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
          />

          <KpiCard
            title="Custo médio por kg"
            value={formatarMoeda(custoMedioKgGeral)}
            hint="Baseado no peso filtrado"
            variation={variacoes.custoKg}
            previousValue={formatarMoeda(custoMedioKgGeralAnterior)}
            isLowerBetter
            background="linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)"
          />

          <KpiCard
            title="Custo médio por m³"
            value={formatarMoeda(custoMedioM3Geral)}
            hint="Baseado na cubagem filtrada"
            variation={variacoes.custoM3}
            previousValue={formatarMoeda(custoMedioM3GeralAnterior)}
            isLowerBetter
            background="linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)"
          />

          <KpiCard
            title="Peso total médio"
            value={`${formatarNumero(pesoMedioGeral, 2)} kg`}
            hint="Média de peso por registro"
            variation={variacoes.peso}
            previousValue={`${formatarNumero(pesoMedioGeralAnterior, 2)} kg`}
            isLowerBetter
            background="linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
          />

          <KpiCard
            title="Cubagem total média"
            value={`${formatarNumero(cubagemMediaGeral, 4)} m³`}
            hint="Média de cubagem por registro"
            variation={variacoes.cubagem}
            previousValue={`${formatarNumero(cubagemMediaGeralAnterior, 4)} m³`}
            isLowerBetter
            background="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
          />

          <div
            style={{
              ...cardStyle,
              background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)'
            }}
          >
            <div style={kpiTitleStyle}>Melhor transportadora</div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.2
              }}
            >
              {melhorTransportadora?.nome || '-'}
            </div>
            <div style={kpiHintStyle}>
              Score: {formatarNumero(melhorTransportadora?.score || 0, 2)}
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
            }}
          >
            <div style={kpiTitleStyle}>Pior transportadora</div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.2
              }}
            >
              {piorTransportadora?.nome || '-'}
            </div>
            <div style={kpiHintStyle}>
              Score: {formatarNumero(piorTransportadora?.score || 0, 2)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <div style={cardStyle}>
            <div style={chartTitleStyle}>Frete médio por estado</div>
            <div style={chartSubtitleStyle}>
              Comparativo dos estados com maior frete médio.
            </div>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fretePorEstado}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="estado" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatarMoeda(Number(value || 0))}
                  />
                  <Bar dataKey="frete" fill="#2563eb" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={chartTitleStyle}>Top produtos por lançamentos</div>
            <div style={chartSubtitleStyle}>
              Produtos com maior participação na base.
            </div>
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProdutos}
                    dataKey="total"
                    nameKey="produto"
                    outerRadius={110}
                    innerRadius={55}
                    paddingAngle={3}
                    labelLine={false}
                    label={({ percent }) =>
                      `${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {topProdutos.map((_, index) => (
                      <Cell
                        key={index}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatarNumero(Number(value || 0), 0)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={chartTitleStyle}>Comparativo de transportadoras</div>
          <div style={chartSubtitleStyle}>
            Frete médio, custo por kg e custo por m³ das principais
            transportadoras.
          </div>
          <div style={{ width: '100%', height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosComparativoTransportadoras}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="nome"
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Frete Médio') {
                      return formatarMoeda(Number(value || 0))
                    }

                    if (name === 'Custo/Kg') {
                      return formatarMoeda(Number(value || 0))
                    }

                    if (name === 'Custo/m³') {
                      return formatarMoeda(Number(value || 0))
                    }

                    return formatarNumero(Number(value || 0), 2)
                  }}
                />
                <Legend />
                <Bar
                  dataKey="freteMedio"
                  name="Frete Médio"
                  fill={barColors[0]}
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="custoKg"
                  name="Custo/Kg"
                  fill={barColors[1]}
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="custoM3"
                  name="Custo/m³"
                  fill={barColors[2]}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
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
            <div style={chartTitleStyle}>Ranking inteligente de transportadoras</div>
            <div style={chartSubtitleStyle}>
              Menor score representa melhor desempenho geral.
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '760px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Transportadora</th>
                    <th style={thStyle}>Frete médio</th>
                    <th style={thStyle}>Custo/kg</th>
                    <th style={thStyle}>Custo/m³</th>
                    <th style={thStyle}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingTransportadoras.map((item, index) => {
                    const isBest = index === 0
                    const isWorst = index === rankingTransportadoras.length - 1

                    return (
                      <tr
                        key={item.nome}
                        style={{
                          background: isBest
                            ? '#f0fdf4'
                            : isWorst
                            ? '#fef2f2'
                            : '#ffffff'
                        }}
                      >
                        <td style={tdStyle}>{index + 1}</td>
                        <td style={tdStyle}>
                          <strong>{item.nome}</strong>
                        </td>
                        <td style={tdStyle}>{formatarMoeda(item.freteMedio)}</td>
                        <td style={tdStyle}>{formatarMoeda(item.custoKg)}</td>
                        <td style={tdStyle}>{formatarMoeda(item.custoM3)}</td>
                        <td style={tdStyle}>{formatarNumero(item.score, 2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={chartTitleStyle}>Peso médio por transportadora</div>
            <div style={chartSubtitleStyle}>
              Média de peso movimentado entre as principais transportadoras.
            </div>
            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pesoPorTransportadora}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="nome"
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      `${formatarNumero(Number(value || 0), 2)} kg`
                    }
                  />
                  <Bar dataKey="peso" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}
        >
          <KpiCard
            title="Quantidade média"
            value={formatarNumero(quantidadeMediaGeral, 2)}
            hint="Média de itens por registro analisado."
            variation={variacoes.quantidade}
            previousValue={formatarNumero(quantidadeMediaGeralAnterior, 2)}
            background="#ffffff"
          />

          <div style={cardStyle}>
            <div style={chartTitleStyle}>Melhor score atual</div>
            <div style={chartSubtitleStyle}>
              Quanto menor, melhor a performance logística consolidada.
            </div>
            <div style={{ fontSize: '34px', fontWeight: 800, color: '#16a34a' }}>
              {formatarNumero(melhorTransportadora?.score || 0, 2)}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={chartTitleStyle}>Pior score atual</div>
            <div style={chartSubtitleStyle}>
              Ajuda a identificar onde está o maior custo relativo.
            </div>
            <div style={{ fontSize: '34px', fontWeight: 800, color: '#dc2626' }}>
              {formatarNumero(piorTransportadora?.score || 0, 2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type KpiCardProps = {
  title: string
  value: string
  hint: string
  variation?: number
  previousValue?: string
  isLowerBetter?: boolean
  background?: string
}

function KpiCard({
  title,
  value,
  hint,
  variation = 0,
  previousValue = '',
  isLowerBetter = false,
  background = '#ffffff'
}: KpiCardProps) {
  const variacaoPositiva = isLowerBetter ? variation <= 0 : variation >= 0
  const corVariacao = variacaoPositiva ? '#16a34a' : '#dc2626'
  const simbolo = variacaoPositiva ? '↑' : '↓'

  return (
    <div
      style={{
        background,
        border: '1px solid #e5e7eb',
        borderRadius: '24px',
        padding: '22px',
        boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)'
      }}
    >
      <div style={kpiTitleStyleGlobal}>{title}</div>
      <div style={kpiValueStyleGlobal}>{value}</div>
      <div style={kpiHintStyleGlobal}>{hint}</div>

      <div
        style={{
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            color: corVariacao,
            background: `${corVariacao}12`,
            padding: '4px 8px',
            borderRadius: '999px'
          }}
        >
          {simbolo} {Math.abs(variation).toFixed(1)}%
        </span>

        {previousValue && (
          <span
            style={{
              fontSize: '12px',
              color: '#64748b'
            }}
          >
            anterior: {previousValue}
          </span>
        )}
      </div>
    </div>
  )
}

const kpiTitleStyleGlobal: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  marginBottom: '10px',
  fontWeight: 600
}

const kpiValueStyleGlobal: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  color: '#0f172a'
}

const kpiHintStyleGlobal: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  marginTop: '8px'
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
