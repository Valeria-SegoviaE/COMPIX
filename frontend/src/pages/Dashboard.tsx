import { useNavigate } from 'react-router-dom'
import type { IconName } from '../types'
import { Icon } from '../components/Icon'
import { EquipmentTable } from '../components/EquipmentTable'
import { useEquipment } from '../context/EquipmentContext'

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

  const cards: { label: string; value: string; change: string; icon: IconName; color: string }[] = [
    { label: 'Total de equipos', value: '248', change: '+12 este mes', icon: 'monitor', color: 'blue' },
    { label: 'Equipos activos', value: '196', change: '79% del inventario', icon: 'check', color: 'green' },
    { label: 'En mantenimiento', value: '18', change: '4 requieren atención', icon: 'tool', color: 'orange' },
    { label: 'Dados de baja', value: '34', change: '3 este mes', icon: 'archive', color: 'gray' },
  ]

  return (
    <>
      <section className="stats-grid">
        {cards.map((card) => (
          <article className="stat-card" key={card.label}>
            <div className={`stat-icon ${card.color}`}><Icon name={card.icon} /></div>
            <div className="stat-copy"><span>{card.label}</span><strong>{card.value}</strong><small>{card.change}</small></div>
            <button aria-label={`Ver ${card.label}`}><Icon name="chevron" size={18} /></button>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div><h2>Equipos por estado</h2><p>Distribución del inventario actual</p></div>
            <select><option>Este año</option><option>Este mes</option></select>
          </div>
          <div className="chart-wrap">
            <div className="donut">
              <div className="donut-center"><strong>248</strong><span>Equipos</span></div>
            </div>
            <div className="chart-legend">
              <div><i className="legend-dot active" /><span>Activos</span><strong>196</strong><small>79%</small></div>
              <div><i className="legend-dot available" /><span>Disponibles</span><strong>18</strong><small>7%</small></div>
              <div><i className="legend-dot maintenance" /><span>Mantenimiento</span><strong>18</strong><small>7%</small></div>
              <div><i className="legend-dot retired" /><span>Dados de baja</span><strong>16</strong><small>7%</small></div>
            </div>
          </div>
        </article>

        <article className="panel activity-panel">
          <div className="panel-heading">
            <div><h2>Actividad reciente</h2><p>Últimos movimientos registrados</p></div>
            <button onClick={() => navigate('/historial')}>Ver todo</button>
          </div>
          <div className="activity-list">
            <Activity icon="users" color="blue" title="Equipo asignado" text="CMP-2025-048 asignado a Mariana Torres" time="Hace 24 min" />
            <Activity icon="tool" color="orange" title="Cambio de estado" text="CMP-2025-046 enviado a mantenimiento" time="Hace 1 h" />
            <Activity icon="plus" color="green" title="Nuevo equipo registrado" text="Estación Diseño 06 agregada al inventario" time="Ayer, 16:42" />
            <Activity icon="edit" color="purple" title="Información actualizada" text="Se editó la ficha de CMP-2025-045" time="Ayer, 11:18" />
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
