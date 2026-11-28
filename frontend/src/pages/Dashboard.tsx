import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IconName } from '../types'
import { Icon } from '../components/Icon'
import { EquipmentTable } from '../components/EquipmentTable'
import { useEquipment } from '../context/EquipmentContext'
import { getTimeline } from '../services/equipmentService'

function Activity({ icon, color, title, text, time }: { icon: IconName; color: string; title: string; text: string; time: string }) {
  return (
    <div className="activity-item">
      <div className={`activity-icon ${color}`}><Icon name={icon} size={17} /></div>
      <div><strong>{title}</strong><p>{text}</p></div>
      <time>{time}</time>
    </div>
  )
}

export default function Dashboard() {
  const { equipment } = useEquipment()
  const navigate = useNavigate()
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof getTimeline>>>([])
  const [activityError, setActivityError] = useState('')

  useEffect(() => {
    let cancelled = false
    getTimeline()
      .then((events) => { if (!cancelled) setActivity(events.slice(0, 4)) })
      .catch((error: unknown) => {
        if (!cancelled) setActivityError(error instanceof Error ? error.message : 'No fue posible cargar la actividad.')
      })
    return () => { cancelled = true }
  }, [])

  const total = equipment.length
  const activos = equipment.filter((item) => item.status === 'Activo').length
  const disponibles = equipment.filter((item) => item.status === 'Disponible').length
  const mantenimiento = equipment.filter((item) => item.status === 'Mantenimiento').length
  const baja = equipment.filter((item) => item.status === 'Baja').length
  const cards: { label: string; value: string; change: string; icon: IconName; color: string; status?: string }[] = [
    { label: 'Total de equipos', value: String(total), change: 'Inventario registrado', icon: 'monitor', color: 'blue' },
    { label: 'Equipos activos', value: String(activos), change: `${total ? Math.round(activos * 100 / total) : 0}% del inventario`, icon: 'check', color: 'green', status: 'Activo' },
    { label: 'En mantenimiento', value: String(mantenimiento), change: 'Equipos en taller', icon: 'tool', color: 'orange', status: 'Mantenimiento' },
    { label: 'Dados de baja', value: String(baja), change: 'Bajas registradas', icon: 'archive', color: 'gray', status: 'Baja' },
  ]
  const percentage = (count: number) => total ? count * 100 / total : 0
  const donutStyle = {
    background: `conic-gradient(#1768e5 0 ${percentage(activos)}%, #54b9a0 ${percentage(activos)}% ${percentage(activos + disponibles)}%, #f0a449 ${percentage(activos + disponibles)}% ${percentage(activos + disponibles + mantenimiento)}%, #9ca9b9 ${percentage(activos + disponibles + mantenimiento)}% 100%)`,
  }

  return (
    <>
      <section className="stats-grid">
        {cards.map((card) => (
          <article className="stat-card" key={card.label}>
            <div className={`stat-icon ${card.color}`}><Icon name={card.icon} /></div>
            <div className="stat-copy"><span>{card.label}</span><strong>{card.value}</strong><small>{card.change}</small></div>
            <button aria-label={`Ver ${card.label}`} onClick={() => navigate(card.status ? `/inventario?estado=${encodeURIComponent(card.status)}` : '/inventario')}><Icon name="chevron" size={18} /></button>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div><h2>Equipos por estado</h2><p>Distribución del inventario actual</p></div>
          </div>
          <div className="chart-wrap">
            <div className="donut" style={donutStyle}>
              <div className="donut-center"><strong>{total}</strong><span>Equipos</span></div>
            </div>
            <div className="chart-legend">
              <div><i className="legend-dot active" /><span>Activos</span><strong>{activos}</strong><small>{total ? `${Math.round(activos * 100 / total)}%` : '0%'}</small></div>
              <div><i className="legend-dot available" /><span>Disponibles</span><strong>{disponibles}</strong><small>{total ? `${Math.round(disponibles * 100 / total)}%` : '0%'}</small></div>
              <div><i className="legend-dot maintenance" /><span>Mantenimiento</span><strong>{mantenimiento}</strong><small>{total ? `${Math.round(mantenimiento * 100 / total)}%` : '0%'}</small></div>
              <div><i className="legend-dot retired" /><span>Dados de baja</span><strong>{baja}</strong><small>{total ? `${Math.round(baja * 100 / total)}%` : '0%'}</small></div>
            </div>
          </div>
        </article>

        <article className="panel activity-panel">
          <div className="panel-heading">
            <div><h2>Actividad reciente</h2><p>Últimos movimientos registrados</p></div>
            <button onClick={() => navigate('/historial')}>Ver todo</button>
          </div>
          <div className="activity-list">
            {activityError && <p className="muted" role="alert">{activityError}</p>}
            {activity.map((item) => (
              <Activity key={item.id} icon={item.icon} color={item.color} title={item.title}
                text={`${item.equipment} · ${item.description}`} time={`${item.date}, ${item.time}`} />
            ))}
            {!activityError && activity.length === 0 && <p className="muted">Aún no hay movimientos registrados.</p>}
          </div>
        </article>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div><h2>Últimos equipos registrados</h2><p>Altas recientes en el inventario</p></div>
          <button onClick={() => navigate('/inventario')}>Ver inventario <Icon name="chevron" size={15} /></button>
        </div>
        <EquipmentTable equipment={equipment.slice(0, 5)} compact showDetail={(item) => navigate(`/inventario/${item.id}`)} />
      </section>
    </>
  )
}
