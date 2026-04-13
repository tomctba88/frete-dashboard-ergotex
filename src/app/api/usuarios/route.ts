import { getUsuarioLogado } from '@/lib/authserver'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get('empresa_id')

    if (!empresaId) {
      return NextResponse.json(
        { error: 'empresa_id não informado' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ usuarios: data || [] })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { nome, email, password, perfil, empresa_id } = body

    if (!nome || !email || !password || !perfil || !empresa_id) {
      return NextResponse.json(
        { error: 'Dados incompletos.' },
        { status: 400 }
      )
    }

    const perfisValidos = ['admin', 'operacional', 'consulta']
    if (!perfisValidos.includes(perfil)) {
      return NextResponse.json(
        { error: 'Perfil inválido.' },
        { status: 400 }
      )
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Erro ao criar usuário no Auth.' },
        { status: 400 }
      )
    }

    const { error: perfilError } = await supabase
      .from('perfis')
      .insert([
        {
          user_id: authData.user.id,
          empresa_id,
          nome,
          email,
          perfil,
          ativo: true
        }
      ])

    if (perfilError) {
      await supabase.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        { error: perfilError.message || 'Erro ao criar perfil.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user_id: authData.user.id
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, nome, perfil, ativo } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do perfil não informado.' },
        { status: 400 }
      )
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (typeof nome === 'string' && nome.trim()) {
      payload.nome = nome.trim()
    }

    if (typeof perfil === 'string') {
      const perfisValidos = ['admin', 'operacional', 'consulta']
      if (!perfisValidos.includes(perfil)) {
        return NextResponse.json(
          { error: 'Perfil inválido.' },
          { status: 400 }
        )
      }
      payload.perfil = perfil
    }

    if (typeof ativo === 'boolean') {
      payload.ativo = ativo
    }

    const { error } = await supabase
      .from('perfis')
      .update(payload)
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar usuário.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
