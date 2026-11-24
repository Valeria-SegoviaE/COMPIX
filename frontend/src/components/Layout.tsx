import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { IconName } from '../types'
import { Icon } from './Icon'
import { Button } from './Button'
import { getSession, logout } from '../services/auth'

const navItems: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Inicio', icon: 'grid' },
  { to: '/inventario', label: 'Inventario', icon: 'monitor' },
  { to: '/asignaciones', label: 'Asignaciones', icon: 'users' },
  { to: '/historial', label: 'Historial', icon: 'history' },
  { to: '/configuracion', label: 'Configuración', icon: 'settings' },
]

const titles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Panel general', subtitle: 'Resumen actualizado del inventario de equipos' },
  '/inventario': { title: 'Inventario de equipos', subtitle: 'Consulta y administra todos los equipos registrados' },
  '/inventario/nuevo': { title: 'Registrar nuevo equipo', subtitle: 'Ingresa la información técnica del equipo' },
  '/asignaciones': { title: 'Asignaciones', subtitle: 'Gestiona los equipos asignados al personal' },
  '/historial': { title: 'Historial de movimientos', subtitle: 'Consulta la actividad reciente de los equipos' },
  '/configuracion': { title: 'Configuración', subtitle: 'Personaliza las preferencias generales del sistema' },
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const session = getSession()

  useEffect(() => {
    setSidebarOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  const isDetail = location.pathname.startsWith('/inventario/') && location.pathname !== '/inventario/nuevo'
  const heading = isDetail
    ? { title: 'Detalle del equipo', subtitle: 'Información completa y estado actual del activo' }
    : titles[location.pathname] ?? titles['/']
  const showBack = isDetail || location.pathname === '/inventario/nuevo'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">×</button>
        <div className="brand">
          <div className="brand-mark"><Icon name="cpu" size={25} /></div>
          <div><strong>COMPIX</strong><span>Gestión de inventario</span></div>
        </div>
        <nav className="main-nav">
          <p>MENÚ PRINCIPAL</p>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-support">
          <span>¿Necesitas ayuda?</span>
          <p>Consulta el centro de soporte</p>
          <button>Ver documentación <Icon name="chevron" size={14} /></button>
        </div>
        <div className="sidebar-profile">
          <div className="avatar">{session?.initials ?? 'CG'}</div>
          <div><strong>{session?.name ?? 'Carlos Gómez'}</strong><span>{session?.role ?? 'Administrador TI'}</span></div>
          <button aria-label="Cerrar sesión" onClick={handleLogout}><Icon name="logout" size={18} /></button>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú" />}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><Icon name="menu" /></button>
          <div className="top-search"><Icon name="search" size={18} /><input placeholder="Buscar equipos, empleados..." /></div>
          <div className="top-actions">
            <span className="date-label">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <button className="icon-btn notification" aria-label="Notificaciones"><Icon name="bell" size={20} /><i /></button>
            <div className="avatar small">{session?.initials ?? 'CG'}</div>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              {showBack && (
                <button className="back-link" onClick={() => navigate('/inventario')}>
                  <Icon name="arrow-left" size={17} /> Volver al inventario
                </button>
              )}
              <h1>{heading.title}</h1>
              <p>{heading.subtitle}</p>
            </div>
            {location.pathname === '/' && <Button variant="secondary" icon="download">Exportar reporte</Button>}
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
