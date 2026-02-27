import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL

/**
 * Fetch wrapper that auto-attaches the Supabase JWT as a Bearer token.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })
}
