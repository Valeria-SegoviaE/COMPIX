import { apiRequest, setToken } from './api'

const KEY = 'compix_session'

export interface Session {
  name: string
  role: string
  initials: string
}

interface LoginResponse {
  token: string
  usuario: {
    idUsuario: number
    nombreCompleto: string
    correo: string
    rol: string
  }
}

export async function login(email: string, password: string): Promise<Session> {
  const response = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo: email, contrasena: password }),
  })
  if (!response) throw new Error('La API no devolvió una sesión.')

  setToken(response.token)
  const user = response.usuario
  const session: Session = {
    name: user.nombreCompleto,
    role: user.rol === 'Admin' ? 'Administrador TI' : 'Técnico de soporte',
    initials: user.nombreCompleto.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
  }
  try { localStorage.setItem(KEY, JSON.stringify(session)) } catch { /* sin storage */ }
  return session
}

export function logout() {
  setToken(null)
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
