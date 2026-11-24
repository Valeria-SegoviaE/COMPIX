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

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (login(email, password)) navigate('/')
    else setError('Ingresa tu correo y contraseña.')
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
        <Button type="submit" icon="lock">Entrar</Button>
        <small className="login-note">Inicio de sesión de demostración: cualquier correo y contraseña funcionan hasta conectar la API.</small>
      </form>
    </div>
  )
}
