// VSE: Autenticación SIMULADA. Se reemplaza por la API real de Julio.
const KEY = 'compix_session'

export interface Session {
  name: string
  role: string
  initials: string
}

export function login(email: string, password: string): Session | null {
  if (!email.trim() || !password.trim()) return null
  const session: Session = { name: 'Carlos Gómez', role: 'Administrador TI', initials: 'CG' }
  try { localStorage.setItem(KEY, JSON.stringify(session)) } catch { /* sin storage */ }
  return session
}

export function logout() {
  try { localStorage.removeItem(KEY) } catch { /* sin storage */ }
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}
