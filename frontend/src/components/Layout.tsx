import { useEffect, useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { IconName } from '../types'
import { Icon } from './Icon'
import { Button } from './Button'
import { getSession, logout } from '../services/auth'
import { useEquipment } from '../context/EquipmentContext'
import { exportCsv } from '../services/export'

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
  const { equipment } = useEquipment()
  const [globalQuery, setGlobalQuery] = useState('')
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

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = globalQuery.trim()
    if (query) navigate(`/inventario?busqueda=${encodeURIComponent(query)}`)
  }

  const exportReport = () => exportCsv(
    'reporte-inventario-compix.csv',
    ['Inventario', 'Equipo', 'Tipo', 'Marca', 'Modelo', 'Empleado', 'Departamento', 'Estado', 'Serie'],
    equipment.map((item) => [item.id, item.name, item.type, item.brand, item.model, item.employee, item.department, item.status, item.serial]),
  )

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
          {navItems.filter((item) => item.to !== '/configuracion' || session?.role === 'Admin').map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-support">
          <span>¿Necesitas ayuda?</span>
          <p>Consulta el centro de soporte</p>
          <a href={`${import.meta.env.VITE_API_URL ?? ''}/swagger`} target="_blank" rel="noreferrer">Ver documentación <Icon name="chevron" size={14} /></a>
        </div>
        <div className="sidebar-profile">
          <div className="avatar">{session?.initials ?? 'CG'}</div>
          <div><strong>{session?.name ?? 'Carlos Gómez'}</strong><span>{session?.role === 'Admin' ? 'Administrador TI' : 'Técnico de soporte'}</span></div>
          <button aria-label="Cerrar sesión" onClick={handleLogout}><Icon name="logout" size={18} /></button>
        </div>
      </aside>
      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú" />}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><Icon name="menu" /></button>
          <form className="top-search" onSubmit={search}><Icon name="search" size={18} /><input value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} placeholder="Buscar equipos, empleados..." aria-label="Buscar en inventario" /></form>
          <div className="top-actions">
            <span className="date-label">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <button className="icon-btn notification" aria-label="Ver actividad reciente" onClick={() => navigate('/historial')}><Icon name="bell" size={20} /><i /></button>
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
            {location.pathname === '/' && <Button variant="secondary" icon="download" onClick={exportReport} disabled={equipment.length === 0}>Exportar reporte</Button>}
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
