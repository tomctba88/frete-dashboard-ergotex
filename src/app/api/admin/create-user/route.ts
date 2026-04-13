import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, senha, perfil, empresa_id } = body

    if (!nome || !email || !senha || !perfil || !empresa_id) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não enviados.' },
        { status: 400 }
      )
    }

    const perfisPermitidos = ['admin', 'operacional', 'consulta']
    if (!perfisPermitidos.includes(perfil)) {
      return NextResponse.json(
        { error: 'Perfil inválido.' },
        { status: 400 }
      )
    }

    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true
      })

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        { error: createUserError?.message || 'Erro ao criar usuário no Auth.' },
        { status: 400 }
      )
    }

    const { error: perfilError } = await supabaseAdmin
      .from('perfis')
      .insert([
        {
          user_id: createdUser.user.id,
          empresa_id,
          nome,
          email,
          perfil,
          ativo: true
        }
      ])

    if (perfilError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id)

      return NextResponse.json(
        { error: perfilError.message || 'Erro ao criar perfil.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user_id: createdUser.user.id
    })
  } catch (error) {
    console.error('Erro interno ao criar usuário:', error)

    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}