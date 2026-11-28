import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Button } from '../components/Button'
import { Field } from '../components/FormFields'
import { getSession, login } from '../services/auth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (getSession()) return <Navigate to="/" replace />

  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <div className="brand-mark"><Icon name="cpu" size={25} /></div>
          <div><strong>COMPIX</strong><span>Gestión de inventario</span></div>
        </div>
        <h1>Iniciar sesión</h1>
        <p>Accede con tu cuenta para administrar el inventario de equipos.</p>
        <div className="login-fields">
          <Field label="Correo electrónico" required type="email" placeholder="usuario@empresa.com" value={email} onChange={setEmail} />
          <Field label="Contraseña" required type="password" placeholder="••••••••" value={password} onChange={setPassword} />
        </div>
        {error && <div className="login-error">{error}</div>}
        <Button type="submit" icon="lock">{submitting ? 'Entrando...' : 'Entrar'}</Button>
      </form>
    </div>
  )
}
