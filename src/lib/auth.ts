import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type PerfilUsuario = {
  id: string
  user_id: string
  empresa_id: string
  nome: string | null
  email: string | null
  perfil: 'admin' | 'operacional' | 'consulta'
  ativo: boolean
}

export type ValidacaoAcesso =
  | {
      ok: true
      motivo: null
      user: User
      perfil: PerfilUsuario
    }
  | {
      ok: false
      motivo: 'sem_sessao' | 'sem_perfil' | 'inativo'
      user: User | null
      perfil: PerfilUsuario | null
    }

export async function getUsuarioAtual(): Promise<User | null> {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getPerfilAtual(): Promise<PerfilUsuario | null> {
  const user = await getUsuarioAtual()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('perfis')
    .select('id, user_id, empresa_id, nome, email, perfil, ativo')
    .eq('user_id', user.id)
    .limit(1)

  if (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }

  if (!data || data.length === 0) {
    console.warn('Usuário autenticado sem perfil cadastrado.')
    return null
  }

  return data[0] as PerfilUsuario
}

export async function validarAcesso(): Promise<ValidacaoAcesso> {
  const user = await getUsuarioAtual()

  if (!user) {
    return {
      ok: false,
      motivo: 'sem_sessao',
      user: null,
      perfil: null
    }
  }

  const perfil = await getPerfilAtual()

  if (!perfil) {
    return {
      ok: false,
      motivo: 'sem_perfil',
      user,
      perfil: null
    }
  }

  if (!perfil.ativo) {
    return {
      ok: false,
      motivo: 'inativo',
      user,
      perfil
    }
  }

  return {
    ok: true,
    motivo: null,
    user,
    perfil
  }
}
