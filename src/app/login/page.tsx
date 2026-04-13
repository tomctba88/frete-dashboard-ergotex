'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    setLoading(false)

    if (error) {
      setErro('E-mail ou senha inválidos.')
      return
    }

    router.replace('/')
    router.refresh()
  }

  return (
    <div style={pageStyle}>
      <div style={backgroundGlowTop} />
      <div style={backgroundGlowBottom} />

      <div style={wrapperStyle}>
        <div style={leftPanelStyle}>
          <div style={brandCardStyle}>
            <div style={logoWrapStyle}>
              <Image
                src="/ergotex_logo.png"
                alt="Ergotex Mobiliário Corporativo"
                width={220}
                height={70}
                priority
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            </div>

            <div style={brandBadgeStyle}>Sistema interno</div>

            <h1 style={brandTitleStyle}>Ergotex Log</h1>

            <p style={brandCompanyStyle}>Ergotex Mobiliário Corporativo</p>

            <p style={brandTextStyle}>
              Acesse o painel de fretes, acompanhe indicadores logísticos e
              centralize a operação em um ambiente seguro, rápido e organizado.
            </p>

            <div style={brandQuoteStyle}>
              “A escolha certa para o seu negócio!”
            </div>

            <div style={featureGridStyle}>
              <div style={featureCardStyle}>
                <div style={featureIconStyle}>📦</div>
                <div>
                  <div style={featureTitleStyle}>Lançamentos</div>
                  <div style={featureTextStyle}>
                    Controle centralizado das operações
                  </div>
                </div>
              </div>

              <div style={featureCardStyle}>
                <div style={featureIconStyle}>📊</div>
                <div>
                  <div style={featureTitleStyle}>Dashboard</div>
                  <div style={featureTextStyle}>
                    Indicadores claros e comparativos
                  </div>
                </div>
              </div>

              <div style={featureCardStyle}>
                <div style={featureIconStyle}>🚚</div>
                <div>
                  <div style={featureTitleStyle}>Transportadoras</div>
                  <div style={featureTextStyle}>
                    Mais análise para melhores decisões
                  </div>
                </div>
              </div>

              <div style={featureCardStyle}>
                <div style={featureIconStyle}>🔒</div>
                <div>
                  <div style={featureTitleStyle}>Acesso seguro</div>
                  <div style={featureTextStyle}>
                    Login protegido por usuário
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={rightPanelStyle}>
          <div style={formCardStyle}>
            <div style={formHeaderStyle}>
              <div style={formTagStyle}>Entrar no sistema</div>
              <h2 style={formTitleStyle}>Bem-vindo de volta</h2>
              <p style={formSubtitleStyle}>
                Faça login para acessar o painel logístico da Ergotex.
              </p>
            </div>

            <form onSubmit={handleLogin} style={formStyle}>
              <div style={fieldGroupStyle}>
                <label htmlFor="email" style={labelStyle}>
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@empresa.com"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label htmlFor="senha" style={labelStyle}>
                  Senha
                </label>

                <div style={passwordWrapStyle}>
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    style={passwordInputStyle}
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha((prev) => !prev)}
                    style={showPasswordButtonStyle}
                  >
                    {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              {erro && <div style={errorStyle}>{erro}</div>}

              <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? 'Entrando...' : 'Entrar no Ergotex Log'}
              </button>
            </form>

            <div style={footerInfoStyle}>
              Acesso restrito a usuários autorizados.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, #061126 0%, #0b1f44 42%, #123c8c 100%)',
  padding: '24px'
}

const wrapperStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  minHeight: 'calc(100vh - 48px)',
  maxWidth: '1380px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '1.1fr 0.9fr',
  gap: '24px',
  alignItems: 'stretch'
}

const leftPanelStyle: React.CSSProperties = {
  display: 'flex'
}

const rightPanelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const brandCardStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '32px',
  padding: '40px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 100%)',
  border: '1px solid rgba(255,255,255,0.14)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 20px 60px rgba(2, 6, 23, 0.35)',
  color: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
}

const logoWrapStyle: React.CSSProperties = {
  width: '240px',
  maxWidth: '100%',
  marginBottom: '18px'
}

const brandBadgeStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '8px 14px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.18)',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  marginBottom: '18px'
}

const brandTitleStyle: React.CSSProperties = {
  fontSize: '54px',
  lineHeight: 1,
  fontWeight: 900,
  margin: '0 0 10px 0'
}

const brandCompanyStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.92)',
  margin: '0 0 16px 0'
}

const brandTextStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: 1.7,
  color: 'rgba(255,255,255,0.84)',
  maxWidth: '620px',
  margin: '0 0 22px 0'
}

const brandQuoteStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#dbeafe',
  marginBottom: '28px'
}

const featureGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '14px'
}

const featureCardStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
  padding: '16px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)'
}

const featureIconStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  minWidth: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.14)',
  fontSize: '18px'
}

const featureTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 800,
  color: '#ffffff',
  marginBottom: '4px'
}

const featureTextStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.78)'
}

const formCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '470px',
  borderRadius: '32px',
  background: '#ffffff',
  border: '1px solid rgba(226, 232, 240, 0.9)',
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.24)',
  padding: '34px'
}

const formHeaderStyle: React.CSSProperties = {
  marginBottom: '24px'
}

const formTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: '999px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: '12px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '14px'
}

const formTitleStyle: React.CSSProperties = {
  fontSize: '32px',
  lineHeight: 1.1,
  color: '#0f172a',
  fontWeight: 900,
  margin: '0 0 8px 0'
}

const formSubtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.6,
  color: '#64748b',
  margin: 0
}

const formStyle: React.CSSProperties = {
  display: 'grid',
  gap: '16px'
}

const fieldGroupStyle: React.CSSProperties = {
  display: 'grid',
  gap: '8px'
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#334155'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '50px',
  borderRadius: '16px',
  border: '1px solid #dbe2ea',
  background: '#f8fafc',
  padding: '0 14px',
  fontSize: '14px',
  color: '#0f172a',
  outline: 'none'
}

const passwordWrapStyle: React.CSSProperties = {
  position: 'relative'
}

const passwordInputStyle: React.CSSProperties = {
  width: '100%',
  height: '50px',
  borderRadius: '16px',
  border: '1px solid #dbe2ea',
  background: '#f8fafc',
  padding: '0 88px 0 14px',
  fontSize: '14px',
  color: '#0f172a',
  outline: 'none'
}

const showPasswordButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  right: '8px',
  transform: 'translateY(-50%)',
  height: '36px',
  borderRadius: '10px',
  border: 'none',
  background: '#e2e8f0',
  color: '#0f172a',
  padding: '0 12px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer'
}

const errorStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: '14px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  fontSize: '13px',
  fontWeight: 700
}

const submitButtonStyle: React.CSSProperties = {
  width: '100%',
  height: '52px',
  borderRadius: '16px',
  border: 'none',
  background: 'linear-gradient(135deg, #0f172a 0%, #123c8c 100%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 800,
  cursor: 'pointer',
  marginTop: '4px',
  boxShadow: '0 12px 24px rgba(18, 60, 140, 0.25)'
}

const footerInfoStyle: React.CSSProperties = {
  marginTop: '18px',
  fontSize: '12px',
  color: '#64748b',
  textAlign: 'center'
}

const backgroundGlowTop: React.CSSProperties = {
  position: 'absolute',
  top: '-120px',
  left: '-120px',
  width: '340px',
  height: '340px',
  borderRadius: '999px',
  background: 'rgba(96, 165, 250, 0.22)',
  filter: 'blur(40px)',
  zIndex: 1
}

const backgroundGlowBottom: React.CSSProperties = {
  position: 'absolute',
  bottom: '-140px',
  right: '-120px',
  width: '360px',
  height: '360px',
  borderRadius: '999px',
  background: 'rgba(59, 130, 246, 0.22)',
  filter: 'blur(42px)',
  zIndex: 1
}