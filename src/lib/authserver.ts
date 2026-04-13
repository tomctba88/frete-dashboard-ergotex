import { createClient } from '@supabase/supabase-js'

export async function getUsuarioLogado(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') || ''
        }
      }
    }
  )

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return perfil
}